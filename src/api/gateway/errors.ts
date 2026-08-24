import type { components } from "../generated/schema"

/**
 * The nine failure kinds docs/ARCHITECTURE.md section 4.2 names. Each has a
 * different recovery, so views branch on the discriminant and on nothing else.
 */
export type ApiErrorKind =
  | "offline"
  | "unauthenticated"
  | "revoked"
  | "forbidden"
  | "unsupported"
  | "not-found"
  | "invalid"
  | "partial"
  | "terminal"

export const API_ERROR_KINDS: readonly ApiErrorKind[] = [
  "offline",
  "unauthenticated",
  "revoked",
  "forbidden",
  "unsupported",
  "not-found",
  "invalid",
  "partial",
  "terminal",
]

type FieldViolation = components["schemas"]["FieldViolation"]

/**
 * What the platform ErrorEnvelope supplied, under client-side names. Every
 * field is optional: an error body that is absent or unparseable still
 * classifies by status and invents no wire field.
 */
export interface EnvelopeDetail {
  /** Stable machine-actionable platform code. The only server field to refine branching on. */
  code?: string
  /** Server-supplied user-safe explanation. */
  message?: string
  /** The server's explicit answer to "may repeating this succeed later". */
  retryable?: boolean
  /** Field-level violations, verbatim from the contract, paths never carrying rejected values. */
  fieldViolations?: readonly FieldViolation[]
  correlationId?: string
  traceId?: string
}

/** Kinds an HTTP status alone can produce. */
export type HttpFailureKind = Exclude<
  ApiErrorKind,
  "offline" | "revoked" | "partial"
>

/** A failure Platform answered, classified by status and decorated by its envelope. */
export interface HttpApiError extends EnvelopeDetail {
  kind: HttpFailureKind
  status: number
}

export interface ApiOfflineError {
  kind: "offline"
  cause?: unknown
}

export interface ApiRevokedError extends EnvelopeDetail {
  kind: "revoked"
}

/**
 * Some of it succeeded. HTTP cannot produce this kind; features construct it
 * from an OperationSnapshot whose status is partially_succeeded.
 */
export interface ApiPartialError extends EnvelopeDetail {
  kind: "partial"
}

/** Every gateway failure resolves to exactly one of these. */
export type ApiError =
  ApiOfflineError | ApiRevokedError | ApiPartialError | HttpApiError

const KIND_BY_STATUS: ReadonlyMap<number, HttpFailureKind> = new Map([
  [400, "invalid"],
  [401, "unauthenticated"],
  [403, "forbidden"],
  [404, "not-found"],
  [501, "unsupported"],
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const isFieldViolation = (value: unknown): value is FieldViolation =>
  isRecord(value) &&
  typeof value.code === "string" &&
  typeof value.field_path === "string" &&
  typeof value.message === "string"

const stringOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined

/**
 * Read an ErrorEnvelope off an untrusted body. Runtime-checked rather than
 * cast: a broken or hostile body degrades to fewer carried fields, never to a
 * wrong type.
 */
export function readEnvelopeDetail(body: unknown): EnvelopeDetail {
  if (!isRecord(body)) return {}

  const violations = Array.isArray(body.field_violations)
    ? body.field_violations.filter(isFieldViolation)
    : undefined

  return {
    code: stringOrUndefined(body.code),
    message: stringOrUndefined(body.message),
    retryable: typeof body.retryable === "boolean" ? body.retryable : undefined,
    fieldViolations:
      violations && violations.length > 0 ? violations : undefined,
    correlationId: stringOrUndefined(body.correlation_id),
    traceId: stringOrUndefined(body.trace_id),
  }
}

/**
 * Decode one response body for normalization. Unparseable JSON degrades to
 * the raw text, which readEnvelopeDetail then treats as carrying nothing.
 */
export function parseBodyText(text: string): unknown {
  if (text.length === 0) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Classify one failed HTTP response into the normalized union. */
export function normalizeHttpFailure(
  status: number,
  body: unknown
): HttpApiError {
  return {
    ...readEnvelopeDetail(body),
    kind: KIND_BY_STATUS.get(status) ?? "terminal",
    status,
  }
}
