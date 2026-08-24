import { describe, expect, it } from "vitest"
import type { ApiError } from "./errors"
import {
  createRefreshCoordinator,
  type CredentialRefresher,
  type RefreshResult,
} from "./refresh"

/** A refresher whose completion the test controls, result per invocation. */
function deferredRefresher(): {
  refresher: CredentialRefresher
  calls: () => number
  completeWith: (result: RefreshResult) => void
} {
  let calls = 0
  let release: ((result: RefreshResult) => void) | null = null

  const refresher = () => {
    calls += 1
    return new Promise<RefreshResult>((resolve) => {
      release = resolve
    })
  }

  return {
    refresher,
    calls: () => calls,
    completeWith: (result) => release?.(result),
  }
}

async function settledRejection(promise: Promise<void>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    return error as ApiError
  }
  throw new Error("expected the refresh attempt to reject")
}

describe("single-flight refresh coordination", () => {
  it("runs the refresh I/O exactly once for concurrent callers", async () => {
    const gate = deferredRefresher()
    const coordinator = createRefreshCoordinator({ refresher: gate.refresher })

    const waiters = Array.from({ length: 10 }, () => coordinator.refreshOnce())
    gate.completeWith({ status: "refreshed" })
    await Promise.all(waiters)

    expect(gate.calls()).toBe(1)
  })

  it("starts a fresh refresh once the previous one has settled", async () => {
    const gate = deferredRefresher()
    const coordinator = createRefreshCoordinator({ refresher: gate.refresher })

    const first = coordinator.refreshOnce()
    gate.completeWith({ status: "refreshed" })
    await first

    const second = coordinator.refreshOnce()
    gate.completeWith({ status: "refreshed" })
    await second

    expect(gate.calls()).toBe(2)
  })

  it("rejects every waiter with revoked and clears session state once when the credential is refused", async () => {
    const gate = deferredRefresher()
    let revocations = 0
    const coordinator = createRefreshCoordinator({
      refresher: gate.refresher,
      onSessionRevoked: () => {
        revocations += 1
      },
    })

    const waiters = Array.from({ length: 10 }, () =>
      settledRejection(coordinator.refreshOnce())
    )
    gate.completeWith({ status: "rejected" })
    const errors = await Promise.all(waiters)

    for (const error of errors) {
      expect(error.kind).toBe("revoked")
    }
    expect(revocations).toBe(1)
  })

  it("rejects every waiter with offline and leaves session state intact when the network fails", async () => {
    const gate = deferredRefresher()
    let revocations = 0
    const coordinator = createRefreshCoordinator({
      refresher: gate.refresher,
      onSessionRevoked: () => {
        revocations += 1
      },
    })

    const waiters = Array.from({ length: 4 }, () =>
      settledRejection(coordinator.refreshOnce())
    )
    gate.completeWith({ status: "network" })
    const errors = await Promise.all(waiters)

    for (const error of errors) {
      expect(error.kind).toBe("offline")
    }
    expect(revocations).toBe(0)
  })

  it("answers a missing refresher with unauthenticated and never revokes", async () => {
    let revocations = 0
    const coordinator = createRefreshCoordinator({
      refresher: null,
      onSessionRevoked: () => {
        revocations += 1
      },
    })

    const error = await settledRejection(coordinator.refreshOnce())

    expect(error.kind).toBe("unauthenticated")
    expect(revocations).toBe(0)
  })

  it("recovers after a refused refresh instead of replaying the settled rejection forever", async () => {
    const gate = deferredRefresher()
    const coordinator = createRefreshCoordinator({
      refresher: gate.refresher,
    })

    const first = settledRejection(coordinator.refreshOnce())
    gate.completeWith({ status: "rejected" })
    expect((await first).kind).toBe("revoked")

    const second = coordinator.refreshOnce()
    gate.completeWith({ status: "refreshed" })
    await second
  })
})
