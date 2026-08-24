import { describe, expect, it } from "vitest"
import {
  backoffDelayMs,
  isSafeMethod,
  isTransientFailure,
  sendWithBoundedRetries,
  type AttemptOutcome,
} from "./retry"

const outcome = (over: Partial<AttemptOutcome>): AttemptOutcome => ({
  settled: false,
  method: "GET",
  ...over,
})

describe("the safe-method predicate", () => {
  it("accepts exactly the methods that carry no side effects", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      expect(isSafeMethod(method)).toBe(true)
    }
    for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
      expect(isSafeMethod(method)).toBe(false)
    }
  })

  it("is case-insensitive", () => {
    expect(isSafeMethod("get")).toBe(true)
    expect(isSafeMethod("post")).toBe(false)
  })
})

describe("the transient-failure predicate: retry only when idempotent and worth it", () => {
  const rows: Array<[string, Partial<AttemptOutcome>, boolean]> = [
    [
      "network loss on a safe method is retried",
      { method: "GET", networkError: true },
      true,
    ],
    [
      "a server error on a safe method is retried",
      { method: "GET", status: 503 },
      true,
    ],
    ["HEAD behaves like GET", { method: "HEAD", status: 500 }, true],
    ["OPTIONS behaves like GET", { method: "OPTIONS", status: 502 }, true],
    [
      "a mutating method is never retried on server errors",
      { method: "POST", status: 503 },
      false,
    ],
    [
      "a mutating method is never retried on network loss",
      { method: "PUT", networkError: true },
      false,
    ],
    [
      "an explicit not-retryable envelope suppresses retry",
      { method: "GET", status: 503, detail: { retryable: false } },
      false,
    ],
    [
      "a rate-limit answer marked retryable is retried",
      { method: "GET", status: 429, detail: { retryable: true } },
      true,
    ],
    [
      "a rate-limit answer without the mark is not",
      { method: "GET", status: 429 },
      false,
    ],
    [
      "a plain client error is never retried",
      { method: "GET", status: 404 },
      false,
    ],
    [
      "a success is never retried",
      { method: "GET", settled: true, status: 200 },
      false,
    ],
  ]

  for (const [name, facts, expected] of rows) {
    it(name, () => {
      expect(isTransientFailure(outcome(facts))).toBe(expected)
    })
  }
})

describe("the bounded attempt loop", () => {
  it("stops at the first success and reports attempts used", async () => {
    let calls = 0
    const result = await sendWithBoundedRetries({
      attempts: 5,
      sleep: () => Promise.resolve(),
      attempt: () => {
        calls += 1
        return Promise.resolve(
          calls < 3 ? outcome({ status: 503 }) : outcome({ settled: true })
        )
      },
    })

    expect(calls).toBe(3)
    expect(result.attemptsUsed).toBe(3)
    expect(result.outcome.settled).toBe(true)
  })

  it("exhausts exactly the bound when every answer stays transient", async () => {
    let calls = 0
    const result = await sendWithBoundedRetries({
      attempts: 3,
      sleep: () => Promise.resolve(),
      attempt: () => {
        calls += 1
        return Promise.resolve(outcome({ status: 500 }))
      },
    })

    expect(calls).toBe(3)
    expect(result.attemptsUsed).toBe(3)
    expect(result.outcome.settled).toBe(false)
  })

  it("spends a single attempt on a failure that will never be retried", async () => {
    let calls = 0
    const result = await sendWithBoundedRetries({
      attempts: 4,
      sleep: () => Promise.resolve(),
      attempt: () => {
        calls += 1
        return Promise.resolve(outcome({ method: "POST", status: 503 }))
      },
    })

    expect(calls).toBe(1)
    expect(result.attemptsUsed).toBe(1)
  })

  it("sleeps between attempts with exponential backoff", async () => {
    const sleptMs: number[] = []
    let calls = 0

    await sendWithBoundedRetries({
      attempts: 4,
      sleep: (ms) => {
        sleptMs.push(ms)
        return Promise.resolve()
      },
      attempt: () => {
        calls += 1
        return Promise.resolve(
          calls < 4 ? outcome({ status: 500 }) : outcome({ settled: true })
        )
      },
    })

    expect(sleptMs).toEqual([150, 300, 600])
  })
})

describe("backoff arithmetic", () => {
  it("doubles per attempt and clamps at the cap", () => {
    expect(backoffDelayMs(1)).toBe(150)
    expect(backoffDelayMs(2)).toBe(300)
    expect(backoffDelayMs(4)).toBe(1200)
    expect(backoffDelayMs(8)).toBe(2000)
    expect(backoffDelayMs(20)).toBe(2000)
  })
})
