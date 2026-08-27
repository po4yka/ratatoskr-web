/* eslint-disable max-lines -- gateway keeps auth, retry, JSON, and stream boundary together. */
import {
  normalizeHttpFailure,
  parseBodyText,
  readEnvelopeDetail,
} from "./errors"
import type { ApiOfflineError, HttpApiError } from "./errors"
import {
  createRefreshCoordinator,
  type CredentialRefresher,
  type RefreshCoordinator,
} from "./refresh"
import {
  defaultSleep,
  sendWithBoundedRetries,
  type AttemptOutcome,
} from "./retry"

/**
 * Structural stand-ins for fetch and Response, so tests inject plain objects
 * and the browser's real ones satisfy the same shapes.
 */
export type GatewayFetch = (
  url: string,
  init: RequestInit
) => Promise<JsonLikeResponse>

export interface JsonLikeResponse {
  ok: boolean
  status: number
  headers: { get(name: string): string | null }
  text(): Promise<string>
  body?: ReadableStream<Uint8Array> | null
}

export interface TokenSource {
  /** The live access credential, or null between sessions. */
  current(): string | null
}

export type GatewayMethod =
  "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"

export interface GatewayRequest {
  path: string
  method?: GatewayMethod
  /** A JSON-serializable request body. */
  body?: unknown
  query?: Record<string, string | number | boolean>
  /** Extra headers, e.g. an Idempotency-Key supplied by the calling feature. */
  headers?: Record<string, string>
  /** Caller cancellation, honoured on every attempt including replays. */
  signal?: AbortSignal
}

export interface Gateway {
  /** Resolve with the parsed JSON payload, or undefined for an empty body. */
  request<T = unknown>(req: GatewayRequest): Promise<T | undefined>
  /** Open an authenticated read stream; callers own framing and cancellation. */
  stream?(req: GatewayRequest): Promise<ReadableStream<Uint8Array>>
}

export interface GatewayDeps {
  baseUrl: string
  tokenSource: TokenSource
  /** Credential refresh strategy; null until session boot wires one. */
  refresher?: CredentialRefresher
  onSessionRevoked?: () => void
  fetchImpl?: GatewayFetch
  sleep?: (ms: number) => Promise<void>
  /** Total transport attempts per request. Default 3. */
  attempts?: number
}

const DEFAULT_ATTEMPTS = 3

/** Marks a transport-level loss: no answer arrived at all. */
class TransportLost {
  readonly cause: unknown

  constructor(cause: unknown) {
    this.cause = cause
  }
}

function abortOf(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("Aborted.", "AbortError")
}

function isAbort(cause: unknown, signal: AbortSignal | undefined): boolean {
  if (signal !== undefined && cause === signal.reason) return true
  return cause instanceof Error && cause.name === "AbortError"
}

function buildUrl(baseUrl: string, request: GatewayRequest): string {
  const joined = `${baseUrl.replace(/\/$/, "")}${request.path}`
  if (request.query === undefined) return joined

  const search = new URLSearchParams()
  for (const key of Object.keys(request.query).sort()) {
    search.set(key, String(request.query[key]))
  }

  return `${joined}?${search.toString()}`
}

async function parseSuccessBody<T>(
  status: number,
  response: JsonLikeResponse
): Promise<T | undefined> {
  const text = await response.text()
  if (text.length === 0) return undefined

  try {
    return JSON.parse(text) as T
  } catch {
    // A 2xx answer this client cannot read is a broken deployment, not noise.
    throw normalizeHttpFailure(status, undefined)
  }
}

/**
 * One request's identity and everything it accumulates across attempts:
 * its fixed coordinates, whether a replay is spent, and the last failure.
 */
interface Attempt<T> {
  request: GatewayRequest
  method: GatewayMethod
  url: string
  replayed: boolean
  errorJson?: unknown
  payload?: T | undefined
}

type StreamOpen = (attempt: Attempt<unknown>) => Promise<JsonLikeResponse>
type StreamFailure = (
  response: JsonLikeResponse,
  attempt: Attempt<unknown>
) => Promise<never>

interface StreamContext {
  refresh: RefreshCoordinator
  open: StreamOpen
  reject: StreamFailure
}

async function openStream(
  attempt: Attempt<unknown>,
  context: StreamContext
): Promise<ReadableStream<Uint8Array>> {
  let response: JsonLikeResponse
  try {
    response = await context.open(attempt)
  } catch (cause) {
    if (cause instanceof TransportLost) throw { kind: "offline" }
    throw cause
  }
  if (response.status === 401 && !attempt.replayed) {
    await context.refresh.refreshOnce()
    attempt.replayed = true
    return openStream(attempt, context)
  }
  if (!response.ok) return context.reject(response, attempt)
  if (response.body === null || response.body === undefined)
    throw new Error("The stream did not open.")
  return response.body
}

export function createGateway(deps: GatewayDeps): Gateway {
  const fetchImpl = deps.fetchImpl ?? ((url, init) => fetch(url, init))
  const sleep = deps.sleep ?? defaultSleep
  const attempts = deps.attempts ?? DEFAULT_ATTEMPTS

  const refresh: RefreshCoordinator = createRefreshCoordinator({
    refresher: deps.refresher ?? null,
    onSessionRevoked: deps.onSessionRevoked,
  })

  function buildInit(attempt: Attempt<unknown>): RequestInit {
    const { request, method } = attempt
    const headers: Record<string, string> = { ...request.headers }
    const token = deps.tokenSource.current()
    if (token !== null) headers.Authorization = `Bearer ${token}`
    if (request.body !== undefined) {
      headers["Content-Type"] = "application/json"
    }

    return {
      method,
      headers,
      signal: request.signal,
      ...(request.body === undefined
        ? {}
        : { body: JSON.stringify(request.body) }),
    }
  }

  /** One exchange with the transport. Caller aborts rethrow untouched. */
  async function exchange(
    attempt: Attempt<unknown>,
    init: RequestInit
  ): Promise<JsonLikeResponse> {
    try {
      return await fetchImpl(attempt.url, init)
    } catch (cause) {
      if (isAbort(cause, init.signal as AbortSignal | undefined)) throw cause
      throw new TransportLost(cause)
    }
  }

  async function failureOutcome<T>(
    response: JsonLikeResponse,
    attempt: Attempt<T>
  ): Promise<AttemptOutcome> {
    const errorJson = parseBodyText(await response.text())
    attempt.errorJson = errorJson
    return {
      settled: false,
      method: attempt.method,
      status: response.status,
      detail: readEnvelopeDetail(errorJson),
    }
  }

  async function attemptOnce<T>(attempt: Attempt<T>): Promise<AttemptOutcome> {
    let response: JsonLikeResponse
    try {
      response = await exchange(attempt, buildInit(attempt))
    } catch (cause) {
      if (cause instanceof TransportLost) {
        return { settled: false, method: attempt.method, networkError: true }
      }
      throw cause
    }

    // The transport may not honour the signal; this client does.
    if (attempt.request.signal?.aborted) throw abortOf(attempt.request.signal)

    if (response.status === 401 && !attempt.replayed) {
      // One refresh per request; the coordinator deduplicates concurrency.
      await refresh.refreshOnce()
      attempt.replayed = true
      return attemptOnce(attempt)
    }

    if (!response.ok) return failureOutcome(response, attempt)

    attempt.payload = await parseSuccessBody<T>(response.status, response)
    return { settled: true, method: attempt.method }
  }

  function classifyFailure<T>(
    outcome: AttemptOutcome,
    attempt: Attempt<T>
  ): ApiOfflineError | HttpApiError {
    if (outcome.networkError === true) return { kind: "offline" }
    return normalizeHttpFailure(outcome.status ?? 0, attempt.errorJson)
  }

  return {
    async request<T = unknown>(
      request: GatewayRequest
    ): Promise<T | undefined> {
      const attempt: Attempt<T> = {
        request,
        method: request.method ?? "GET",
        url: buildUrl(deps.baseUrl, request),
        replayed: false,
        payload: undefined,
      }

      const result = await sendWithBoundedRetries({
        attempts,
        sleep,
        attempt: () => attemptOnce(attempt),
      })

      if (!result.outcome.settled)
        throw classifyFailure(result.outcome, attempt)

      return attempt.payload
    },
    async stream(request: GatewayRequest): Promise<ReadableStream<Uint8Array>> {
      const attempt: Attempt<unknown> = {
        request,
        method: request.method ?? "GET",
        url: buildUrl(deps.baseUrl, request),
        replayed: false,
      }
      return openStream(attempt, {
        refresh,
        open: (current) => exchange(current, buildInit(current)),
        reject: async (response, current) => {
          const outcome = await failureOutcome(response, current)
          throw classifyFailure(outcome, current)
        },
      })
    },
  }
}
