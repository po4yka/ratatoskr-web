import type { GatewayRequest } from "@/api/gateway/client"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"

/*
 * The session routes as Edge answers them at Platform e7a1488: the schemas
 * SessionList and SessionSummary of openapi/openapi.json, with the site_id
 * and hostname of a site_owner session, DELETE /v1/sessions/{session_id} and
 * POST /v1/sessions/revoke-site (crates/public-api/src/sessions.rs and
 * site_sessions.rs).
 */

export const BLOG_FIRST = "018f0000-0000-7000-8000-00000000a001"
export const BLOG_SECOND = "018f0000-0000-7000-8000-00000000a002"
export const GARDEN = "018f0000-0000-7000-8000-00000000a003"
export const BROWSER = "018f0000-0000-7000-8000-00000000a004"

function siteSession([id, site, issued]: readonly [string, string, string]) {
  return {
    session_id: id,
    kind: "site_owner",
    site_id: site,
    hostname: `${site}.example.org`,
    device: null,
    issued_at: issued,
    expires_at: "2026-10-15T21:00:00Z",
    last_seen_at: "2026-10-15T09:30:00Z",
  }
}

/** One page of `GET /v1/sessions`: three site sessions and this browser. */
export const sessionList = {
  sessions: [
    siteSession([BLOG_FIRST, "blog", "2026-10-15T09:20:00Z"]),
    siteSession([GARDEN, "garden", "2026-10-15T09:10:00Z"]),
    siteSession([BLOG_SECOND, "blog", "2026-10-15T09:00:00Z"]),
    {
      session_id: BROWSER,
      kind: "browser",
      site_id: null,
      hostname: null,
      device: null,
      issued_at: "2026-10-15T08:00:00Z",
      expires_at: "2026-10-16T08:00:00Z",
      last_seen_at: "2026-10-15T09:59:00Z",
    },
  ],
  next_cursor: null,
}

/** The session list, the revocation of one session and of one site. */
export function sessionRoutes(request: GatewayRequest): unknown {
  if (request.path === "/v1/sessions") return sessionList
  if (request.path === "/v1/sessions/revoke-site") return { revoked: 2 }
  if (request.path.startsWith("/v1/sessions/") && request.method === "DELETE")
    return undefined
  throw { kind: "not-found", status: 404 }
}

/**
 * Mount the whole application at `/sessions` behind a gateway double. The
 * returned list records every request in order.
 */
export function renderSessions(): GatewayRequest[] {
  window.history.replaceState(null, "", "/sessions")
  storeCustody("credential-1")
  const calls: GatewayRequest[] = []
  const gateway = gatewayOf(async (request) => {
    calls.push(request)
    if (request.path === "/v1/capabilities")
      return {
        api_version: "1",
        capabilities: ["sites.manage"],
        minimum_client_versions: { web: "0.0.1", mobile: "0.0.1" },
        services: [],
      }
    return sessionRoutes(request)
  })
  renderApp({ gateway })
  return calls
}
