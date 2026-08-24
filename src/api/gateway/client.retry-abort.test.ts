import { describe, expect, it } from "vitest"
import { createGateway } from "./client"
import {
  baseDeps,
  envelope,
  expectHttpError,
  jsonResponse,
  scriptedFetch,
  settledRejection,
} from "./gateway-fixtures"

describe("retry behaviour at the boundary", () => {
  it("retries a safe method within the bound and then succeeds", async () => {
    const sleptMs: number[] = []
    const script = scriptedFetch([
      () => jsonResponse(503, envelope({ retryable: true })),
      () => jsonResponse(503, envelope({ retryable: true })),
      () => jsonResponse(200, { capabilities: [] }),
    ])

    const gateway = createGateway({
      ...baseDeps(script.fetchImpl),
      sleep: (ms) => {
        sleptMs.push(ms)
        return Promise.resolve()
      },
    })

    await expect(
      gateway.request({ path: "/v1/capabilities" })
    ).resolves.toEqual({ capabilities: [] })
    expect(script.calls()).toBe(3)
    expect(sleptMs.length).toBe(2)
  })

  it("never auto-retries a mutating method", async () => {
    const script = scriptedFetch([
      () => jsonResponse(503, envelope({ retryable: true })),
    ])

    const gateway = createGateway(baseDeps(script.fetchImpl))
    const error = await settledRejection(
      gateway.request({ path: "/v1/captures", method: "POST" })
    )

    expect(script.calls()).toBe(1)
    expect(error.kind).toBe("terminal")
    expectHttpError(error)
    expect(error.status).toBe(503)
  })

  it("carries the server's retryable answer on a terminal failure", async () => {
    const script = scriptedFetch([
      () => jsonResponse(500, envelope({ retryable: true })),
      () => jsonResponse(500, envelope({ retryable: true })),
      () => jsonResponse(500, envelope({ retryable: true })),
    ])

    const gateway = createGateway(baseDeps(script.fetchImpl))
    const error = await settledRejection(
      gateway.request({ path: "/v1/capabilities" })
    )

    expect(error.kind).toBe("terminal")
    expectHttpError(error)
    expect(error.retryable).toBe(true)
    expect(script.calls()).toBe(3)
  })

  it("classifies transport loss as offline without touching the session", async () => {
    let revocations = 0
    const fetchImpl = () =>
      Promise.reject(new TypeError("Failed to fetch")) as never

    const gateway = createGateway({
      ...baseDeps(fetchImpl),
      onSessionRevoked: () => {
        revocations += 1
      },
    })

    const error = await settledRejection(
      gateway.request({ path: "/v1/capabilities" })
    )

    expect(error.kind).toBe("offline")
    expect(revocations).toBe(0)
  })
})

describe("caller cancellation", () => {
  it("passes an already-aborted signal to the transport and rejects untouched", async () => {
    const controller = new AbortController()
    controller.abort()

    const seenSignals: AbortSignal[] = []
    const script = scriptedFetch([
      (init) => {
        seenSignals.push(init.signal as AbortSignal)
        return jsonResponse(200, { capabilities: [] })
      },
    ])

    const gateway = createGateway(baseDeps(script.fetchImpl))

    await expect(
      gateway.request({
        path: "/v1/capabilities",
        signal: controller.signal,
      })
    ).rejects.not.toHaveProperty("kind")

    expect(seenSignals[0]).toBe(controller.signal)
  })

  it("does not issue further attempts once the caller has aborted", async () => {
    const controller = new AbortController()
    let attemptsSeen = 0

    const script = scriptedFetch([
      () => {
        attemptsSeen += 1
        controller.abort()
        return jsonResponse(503, envelope({ retryable: true }))
      },
      () => {
        attemptsSeen += 1
        return jsonResponse(200)
      },
    ])

    const gateway = createGateway({
      ...baseDeps(script.fetchImpl),
    })

    await expect(
      gateway.request({
        path: "/v1/capabilities",
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: "AbortError" })
    expect(attemptsSeen).toBe(1)
  })
})
