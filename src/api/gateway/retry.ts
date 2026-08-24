import type { EnvelopeDetail } from "./errors"

/** Methods that carry no side effects and may be repeated by the transport. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export const isSafeMethod = (method: string): boolean =>
  SAFE_METHODS.has(method.toUpperCase())

/**
 * What one transport attempt reported, besides success or failure. The
 * envelope detail rides along so the server's explicit retryability answer
 * can veto a retry.
 */
export interface AttemptOutcome {
  /** True when the request reached an end state worth returning. */
  settled: boolean
  method: string
  /** The transport threw instead of answering: treat as offline-classed. */
  networkError?: boolean
  status?: number
  detail?: EnvelopeDetail
}

/** Whether the answer itself is worth another attempt, given a safe method. */
export function isTransientFailure(outcome: AttemptOutcome): boolean {
  if (outcome.settled) return false
  if (!isSafeMethod(outcome.method)) return false
  if (outcome.detail?.retryable === false) return false

  return isTransientAnswer(outcome)
}

const RATE_LIMITED = 429

function isTransientAnswer(outcome: AttemptOutcome): boolean {
  if (outcome.networkError === true) return true
  if (outcome.status === undefined) return false
  if (outcome.status >= 500) return true
  if (outcome.status !== RATE_LIMITED) return false

  return outcome.detail?.retryable === true
}

export interface BackoffOptions {
  baseMs: number
  capMs: number
}

const DEFAULT_BACKOFF: BackoffOptions = { baseMs: 150, capMs: 2000 }

/** Real timing for production; tests inject their own instant sleep. */
export const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/** Exponential backoff in whole milliseconds, clamped at the cap. */
export function backoffDelayMs(
  attempt: number,
  options: BackoffOptions = DEFAULT_BACKOFF
): number {
  const raw = options.baseMs * 2 ** (attempt - 1)
  return Math.min(options.capMs, raw)
}

export interface BoundedSendResult {
  attemptsUsed: number
  outcome: AttemptOutcome
}

/**
 * Drive attempts until success, a non-transient answer, or the bound. Timing
 * is injected so tests run instantly and production gets real backoff.
 */
export async function sendWithBoundedRetries(args: {
  attempts: number
  sleep: (ms: number) => Promise<void>
  attempt: () => Promise<AttemptOutcome>
}): Promise<BoundedSendResult> {
  let outcome = await args.attempt()
  let used = 1

  while (
    !outcome.settled &&
    isTransientFailure(outcome) &&
    used < args.attempts
  ) {
    await args.sleep(backoffDelayMs(used))
    outcome = await args.attempt()
    used += 1
  }

  return { attemptsUsed: used, outcome }
}
