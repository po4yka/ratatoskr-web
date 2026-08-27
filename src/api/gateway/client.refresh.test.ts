import { describe, expect, it } from "vitest"
import { createGateway } from "./client"
import {
  baseDeps,
  envelope,
  jsonResponse,
  scriptedFetch,
  settledRejection,
} from "./gateway-fixtures"

describe("silent refresh through the gateway", () => {
  it("refreshes and reopens an authenticated progress stream after a 401", async () => {
    let refreshCalls = 0
    const body = new ReadableStream<Uint8Array>()
    const script = scriptedFetch([
      () => jsonResponse(401, envelope()),
      () => ({
        body,
        headers: new Headers(),
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
      }),
    ])
    const gateway = createGateway({
      ...baseDeps(script.fetchImpl),
      refresher: async () => {
        refreshCalls += 1
        return { status: "refreshed" }
      },
      tokenSource: { current: () => (refreshCalls === 0 ? null : "fresh") },
    })

    await expect(
      gateway.stream?.({ path: "/v1/operations/operation-1/events" })
    ).resolves.toBe(body)
    expect(refreshCalls).toBe(1)
    expect(script.calls()).toBe(2)
    expect(new Headers(script.inits[1].headers).get("authorization")).toBe(
      "Bearer fresh"
    )
  })

  it("refreshes exactly once for concurrent 401s and replays every waiter", async () => {
    let refreshCalls = 0
    let releaseRefresh!: () => void
    const refreshed = new Promise<void>((resolve) => {
      releaseRefresh = resolve
    })

    const script = scriptedFetch([
      () => jsonResponse(401, envelope()),
      () => jsonResponse(401, envelope()),
      () => jsonResponse(401, envelope()),
      () => jsonResponse(200, { capabilities: [] }),
      () => jsonResponse(200, { capabilities: [] }),
      () => jsonResponse(200, { capabilities: [] }),
    ])

    const gateway = createGateway({
      ...baseDeps(script.fetchImpl),
      refresher: async () => {
        refreshCalls += 1
        await refreshed
        return { status: "refreshed" }
      },
      tokenSource: { current: () => (refreshCalls > 0 ? "fresh" : null) },
    })

    const pending = [
      gateway.request({ path: "/v1/capabilities" }),
      gateway.request({ path: "/v1/capabilities" }),
      gateway.request({ path: "/v1/capabilities" }),
    ]
    releaseRefresh()
    const results = await Promise.all(pending)

    expect(refreshCalls).toBe(1)
    expect(results.every((payload) => payload !== undefined)).toBe(true)
    expect(script.calls()).toBe(6)
  })

  it("surfaces unauthenticated when a replayed request is answered 401 again without refreshing twice", async () => {
    let refreshCalls = 0
    const script = scriptedFetch([
      () => jsonResponse(401, envelope()),
      () => jsonResponse(401, envelope()),
    ])

    const gateway = createGateway({
      ...baseDeps(script.fetchImpl),
      refresher: async () => {
        refreshCalls += 1
        return { status: "refreshed" }
      },
    })

    const error = await settledRejection(
      gateway.request({ path: "/v1/capabilities" })
    )

    expect(error.kind).toBe("unauthenticated")
    expect(refreshCalls).toBe(1)
    expect(script.calls()).toBe(2)
  })

  it("rejects with revoked and clears session state once when refresh is refused", async () => {
    let revocations = 0
    const script = scriptedFetch([() => jsonResponse(401, envelope())])

    const gateway = createGateway({
      ...baseDeps(script.fetchImpl),
      refresher: async () => ({ status: "rejected" }),
      onSessionRevoked: () => {
        revocations += 1
      },
    })

    const error = await settledRejection(
      gateway.request({ path: "/v1/capabilities" })
    )

    expect(error.kind).toBe("revoked")
    expect(revocations).toBe(1)
  })
})
