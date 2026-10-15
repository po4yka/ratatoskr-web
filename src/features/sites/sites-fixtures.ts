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
