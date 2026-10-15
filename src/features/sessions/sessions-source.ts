import type { Gateway } from "@/api/gateway/client"
import type { components } from "@/api/generated/schema"

export type SessionSummary = components["schemas"]["SessionSummary"]
type SessionList = components["schemas"]["SessionList"]
type RevokeSiteSessions = components["schemas"]["RevokeSiteSessions"]
type RevokedSiteSessions = components["schemas"]["RevokedSiteSessions"]

/** The sessions of one site, in the order of the list. */
export interface SiteSessions {
  readonly siteId: string
  readonly hostname: string | null
  readonly sessions: readonly SessionSummary[]
}

/**
 * The `site_owner` sessions grouped by site, in ascending site id, and
 * every other session apart.
 */
export function groupBySite(sessions: readonly SessionSummary[]): {
  readonly sites: readonly SiteSessions[]
  readonly others: readonly SessionSummary[]
} {
  const sites = new Map<string, SessionSummary[]>()
  const others: SessionSummary[] = []
  for (const session of sessions) {
    const siteId = session.kind === "site_owner" ? session.site_id : null
    if (siteId === null || siteId === undefined) others.push(session)
    else sites.set(siteId, [...(sites.get(siteId) ?? []), session])
  }
  return {
    sites: [...sites.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([siteId, list]) => ({
        siteId,
        hostname: list.find((entry) => entry.hostname)?.hostname ?? null,
        sessions: list,
      })),
    others,
  }
}

/** The session calls, all through the one gateway. */
export function sessionsSource(gateway: Gateway) {
  return {
    async page(cursor: string | null): Promise<SessionList> {
      const answer = await gateway.request<SessionList>({
        path: "/v1/sessions",
        query: cursor === null ? undefined : { cursor },
      })
      return answer ?? { sessions: [], next_cursor: null }
    },
    async revoke(sessionId: string): Promise<void> {
      await gateway.request({
        path: `/v1/sessions/${encodeURIComponent(sessionId)}`,
        method: "DELETE",
      })
    },
    async revokeSite(siteId: string): Promise<number> {
      const body: RevokeSiteSessions = { site_id: siteId }
      const answer = await gateway.request<RevokedSiteSessions>({
        path: "/v1/sessions/revoke-site",
        method: "POST",
        body,
      })
      return answer?.revoked ?? 0
    },
  }
}

export type SessionsSource = ReturnType<typeof sessionsSource>

const KIND_MESSAGES: Readonly<Record<string, string>> = {
  offline: "You are offline. Connect to the network and try again.",
  unauthenticated: "Your session ended. Sign in again.",
  revoked: "Your session was revoked. Sign in again.",
  "not-found":
    "The server does not know this session. It can be ended already.",
  terminal: "The server did not answer in time. Try again later.",
}

/**
 * One user-safe sentence for a failure. It reads only the kind, never a
 * request value.
 */
export function describeSessionsFailure(failure: unknown, fallback: string) {
  if (typeof failure !== "object" || failure === null) return fallback
  const { kind } = failure as { kind?: unknown }
  if (typeof kind === "string" && kind in KIND_MESSAGES)
    return KIND_MESSAGES[kind]
  return fallback
}
