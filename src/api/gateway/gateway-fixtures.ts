import type { components } from "../generated/schema"
import type { ApiError, HttpApiError } from "./errors"
import type { GatewayDeps, GatewayFetch, JsonLikeResponse } from "./client"

type ErrorEnvelope = components["schemas"]["ErrorEnvelope"]

export const envelope = (over: Partial<ErrorEnvelope> = {}): ErrorEnvelope => ({
  code: "platform.test.failed",
  message: "Something failed.",
  retryable: false,
  ...over,
})

/** A minimal stand-in for the parts of Response the gateway reads. */
export function jsonResponse(status: number, body?: unknown): JsonLikeResponse {
  const text = body === undefined ? "" : JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(
      body === undefined ? {} : { "content-type": "application/json" }
    ),
    text: () => Promise.resolve(text),
  }
}

type ScriptStep = (init: RequestInit) => JsonLikeResponse

export interface FetchScript {
  fetchImpl: GatewayFetch
  calls: () => number
  inits: RequestInit[]
}

/** Answers each call with the next scripted step; the last step repeats. */
export function scriptedFetch(script: ScriptStep[]): FetchScript {
  let index = 0
  const inits: RequestInit[] = []

  const fetchImpl: GatewayFetch = (_url, init) => {
    inits.push(init)
    const step = script[Math.min(index, script.length - 1)]
    index += 1
    return Promise.resolve(step(init))
  }

  return { fetchImpl, calls: () => index, inits }
}

export async function settledRejection(
  promise: Promise<unknown>
): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    return error as ApiError
  }
  throw new Error("expected the request to reject")
}

export function expectHttpError(
  error: ApiError
): asserts error is HttpApiError {
  if (!("status" in error)) {
    throw new Error("expected an HTTP-classified failure")
  }
}

export function baseDeps(fetchImpl: GatewayFetch): GatewayDeps {
  return {
    baseUrl: "https://edge.example",
    tokenSource: { current: () => null },
    refresher: null,
    fetchImpl,
    sleep: () => Promise.resolve(),
  }
}
