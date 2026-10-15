import type { GatewayRequest } from "@/api/gateway/client"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"

/*
 * The site routes as Edge answers them at Platform 3a47f0f (workspace change
 * add-site-publications): crates/public-api/src/site_reads.rs,
 * site_approvals.rs and site_releases.rs, and the sites rows of
 * openapi/openapi.json.
 */

/** How a test answers one site request. */
export type SitesResponder = (request: GatewayRequest) => unknown

/** A digest of 64 lower-case hex digits made of one repeated digit. */
export function digest(digit: string): string {
  return digit.repeat(64)
}

/** The answer of `GET /v1/sites`: one site in each approval state. */
export const siteList = {
  sites: [
    {
      site_id: "archive",
      submitted_manifest_sha256: digest("1"),
      approved_manifest_sha256: digest("1"),
      approval_state: "withdrawn",
    },
    {
      site_id: "blog",
      submitted_manifest_sha256: digest("2"),
      approved_manifest_sha256: digest("2"),
      approval_state: "approved",
    },
    {
      site_id: "drafts",
      submitted_manifest_sha256: digest("3"),
      approved_manifest_sha256: null,
      approval_state: "unapproved",
    },
    {
      site_id: "garden",
      submitted_manifest_sha256: digest("5"),
      approved_manifest_sha256: digest("4"),
      approval_state: "approved",
    },
  ],
}

/** The answer of `GET /v1/sites/{site}/manifest` for a site of the list. */
export function activeManifest(siteId: string) {
  const site = siteList.sites.find((entry) => entry.site_id === siteId)
  return {
    site_id: siteId,
    manifest_sha256: site?.submitted_manifest_sha256 ?? digest("0"),
    hostname: `${siteId}.example.org`,
    publications: ["notes"],
    capabilities: ["pages.read", "search.publication", "draft.read"],
  }
}

function approval(siteId: string, state: string) {
  const manifest = activeManifest(siteId)
  return {
    site_id: siteId,
    manifest_sha256: manifest.manifest_sha256,
    capabilities: manifest.capabilities,
    hostname: manifest.hostname,
    state,
  }
}

/** `"<METHOD> <path>"` of one recorded call. */
export function routeOf(call: GatewayRequest): string {
  return `${call.method ?? "GET"} ${call.path}`
}

/** The recorded call of `"<METHOD> <path>"`, if the client sent it. */
export function callOf(
  calls: readonly GatewayRequest[],
  route: string
): GatewayRequest | undefined {
  return calls.find((call) => routeOf(call) === route)
}

const SITE_ROUTE = /^\/v1\/sites\/([a-z0-9-]+)\/manifest(\/approval)?$/

/**
 * The registry, manifest and approval routes. Any other route answers 404,
 * so each test states the other routes it relies on.
 */
export function siteRoutes(request: GatewayRequest): unknown {
  if (request.path === "/v1/sites") return siteList
  const match = SITE_ROUTE.exec(request.path)
  if (match === null) throw { kind: "not-found", status: 404 }
  const [, siteId, approvalRoute] = match
  if (approvalRoute === undefined) return activeManifest(siteId)
  return approval(
    siteId,
    request.method === "DELETE" ? "withdrawn" : "approved"
  )
}

/**
 * Mount the whole application at `path` behind a gateway double. The
 * capability document lists `sites.manage`; every other request goes to the
 * test's responder. The returned list records every request in order.
 */
export function renderSites(options: {
  readonly path: string
  readonly respond: SitesResponder
}): GatewayRequest[] {
  window.history.replaceState(null, "", options.path)
  storeCustody("credential-1")
  const calls: GatewayRequest[] = []
  const gateway = gatewayOf(async (request) => {
    calls.push(request)
    if (request.path === "/v1/capabilities")
      return {
        api_version: "1",
        capabilities: ["notes.vaults", "sites.manage"],
        minimum_client_versions: { web: "0.0.1", mobile: "0.0.1" },
        services: [],
      }
    return options.respond(request)
  })
  renderApp({ gateway })
  return calls
}

/** The callback page of `blog` with the code that the sign-in route issues. */
export const signInCallback =
  "https://blog.example.org/.ratatoskr/sign-in/?code=code-1"

/**
 * The site routes and `POST /v1/sites/{site}/sign-in-codes` of Platform
 * e7a1488 (crates/public-api/src/sites.rs): `blog` gets a code, and every
 * other site answers 404 `sites.site_not_found`.
 */
export function signInRoutes(request: GatewayRequest): unknown {
  if (request.path === "/v1/sites/blog/sign-in-codes")
    return {
      code: "code-1",
      redirect_url: signInCallback,
      expires_at: "2026-10-15T10:01:00Z",
    }
  if (request.path.endsWith("/sign-in-codes"))
    throw { kind: "not-found", status: 404, code: "sites.site_not_found" }
  return siteRoutes(request)
}

/** The stored publication `notes` of `blog`, as the sites schema holds it. */
export const storedPublication = {
  publication_id: "notes",
  connection_id: "connection-1",
  mode: "flagged",
  release_mode: "automatic",
  state: "active",
  included_folders: ["blog"],
  excluded_folders: [],
  included_tags: [],
  frontmatter_allow: ["summary"],
}

function vault(id: string, name: string) {
  return {
    connection_id: id,
    channel: "sync",
    vault_display_name: name,
    state: "active",
    excluded_folders: [],
  }
}

/**
 * The site routes, the publications of `blog`, the vault connections and
 * the save of a publication, which answers the publication it stored.
 */
export function publicationRoutes(request: GatewayRequest): unknown {
  const publications = "/v1/sites/blog/publications"
  if (request.path === publications)
    return { publications: [storedPublication] }
  if (request.path === `${publications}/notes`)
    return { publication_id: "notes", state: "active", ...(request.body ?? {}) }
  if (request.path === "/v1/notes/connections")
    return {
      connections: [
        vault("connection-1", "Work"),
        vault("connection-2", "Personal"),
      ],
    }
  return siteRoutes(request)
}

/** The release history of `blog` that `GET /v1/sites/blog/releases` answers. */
export interface ReleaseHistoryFixture {
  readonly current_release_id: string | null
  readonly releases: readonly object[]
  readonly failed_builds: readonly object[]
}

/**
 * The publication routes, the release history of `blog`, the build request,
 * which answers 202 with an operation, and that operation, which runs.
 */
export function releaseRoutes(history: ReleaseHistoryFixture) {
  return (request: GatewayRequest): unknown => {
    if (request.path === "/v1/sites/blog/releases")
      return request.method === "POST"
        ? { operation_id: "operation-9", status: "accepted" }
        : history
    if (request.path === "/v1/operations/operation-9")
      return {
        operation_id: "operation-9",
        kind: "sites.release.build",
        status: "running",
        stage: null,
        progress_percent: null,
        status_changed_at: "2026-10-15T10:00:00Z",
        created_at: "2026-10-15T09:59:00Z",
        retryable: false,
        errors: [],
        warnings: [],
      }
    return publicationRoutes(request)
  }
}
