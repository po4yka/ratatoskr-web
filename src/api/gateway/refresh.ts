import type { ApiOfflineError, ApiRevokedError, HttpApiError } from "./errors"

/**
 * What the injected credential refresh reported. The strategy lives outside
 * this module — the pinned contract mints sessions once and defines no
 * refresh endpoint — so its outcome is an explicit union rather than
 * something inferred from exceptions.
 */
export type RefreshResult =
  /** A fresh credential is in place; replay may begin. */
  | { status: "refreshed" }
  /** The server refused the credential: the session is over. */
  | { status: "rejected" }
  /** The refresh could not be delivered: the session stays intact. */
  | { status: "network" }

/** Performs the actual credential refresh. Null means no strategy is wired yet. */
export type CredentialRefresher = (() => Promise<RefreshResult>) | null

export interface RefreshCoordinatorDeps {
  refresher: CredentialRefresher
  /** Invoked exactly once per confirmed revocation, before waiters see it. */
  onSessionRevoked?: () => void
}

export interface RefreshCoordinator {
  /**
   * Join the single in-flight refresh. Resolves once a fresh credential is in
   * place and one replay is warranted; rejects with the truthful failure for
   * every waiter.
   */
  refreshOnce(): Promise<void>
}

const revokedError = (): ApiRevokedError => ({ kind: "revoked" })

const offlineError = (cause?: unknown): ApiOfflineError => ({
  kind: "offline",
  cause,
})

/**
 * Own the one refresh implementation. Concurrent callers share the in-flight
 * attempt; a settled attempt never answers twice.
 */
export function createRefreshCoordinator(
  deps: RefreshCoordinatorDeps
): RefreshCoordinator {
  let inFlight: Promise<void> | null = null

  const runRefresh = async (): Promise<void> => {
    if (deps.refresher === null) {
      // No strategy wired yet: a 401 is a state to surface, not to hide.
      const unauthenticated: HttpApiError = {
        kind: "unauthenticated",
        status: 401,
      }
      throw unauthenticated
    }

    let result: RefreshResult
    try {
      result = await deps.refresher()
    } catch (cause) {
      throw offlineError(cause)
    }

    if (result.status === "rejected") {
      deps.onSessionRevoked?.()
      throw revokedError()
    }
    if (result.status === "network") {
      throw offlineError()
    }
  }

  return {
    refreshOnce() {
      inFlight ??= runRefresh().finally(() => {
        inFlight = null
      })
      return inFlight
    },
  }
}
