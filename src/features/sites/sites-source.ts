import type { Gateway } from "@/api/gateway/client"
import type { components } from "@/api/generated/schema"

/*
 * The site shapes of workspace change add-site-publications, as Platform
 * 3a47f0f serves them: the schemas SiteList, SiteManifestState,
 * ActiveSiteManifest, SiteApprovalRequest and SiteApproval of
 * openapi/openapi.json, from crates/public-api/src/site_reads.rs and
 * site_approvals.rs. They were written here while the pinned contract had
 * no site route. The sign-in code of workspace change
 * add-site-owner-editing-and-live uses the generated types.
 */

type SignInCodeRequest = components["schemas"]["SignInCodeRequest"]
type SignInCodeIssued = components["schemas"]["SignInCodeIssued"]

export type SiteApprovalState = "unapproved" | "approved" | "withdrawn"

/** One site of `GET /v1/sites`. */
export interface SiteManifestState {
  readonly site_id: string
  /** The digest of the active manifest; `null` when the site has none. */
  readonly submitted_manifest_sha256?: string | null
  /** The digest of the last approval or withdrawal; `null` when never approved. */
  readonly approved_manifest_sha256?: string | null
  readonly approval_state: SiteApprovalState
}

/** `GET /v1/sites/{site}/manifest`: the active manifest of the site. */
export type ActiveSiteManifest = Readonly<
  components["schemas"]["ActiveSiteManifest"]
>

/** The answer of the approval and of the withdrawal. */
export type SiteApproval = Readonly<components["schemas"]["SiteApproval"]>

/**
 * The capabilities that any visitor of a site can use (workspace spec
 * `site-manifest`). Every other name needs an owner session.
 */
export const PUBLIC_CAPABILITIES: readonly string[] = [
  "pages.read",
  "assets.read",
  "search.publication",
  "live.release",
]

function required<T>(answer: T | undefined): T {
  if (answer === undefined) throw new Error("The site answer was empty.")
  return answer
}

function site(siteId: string): string {
  return `/v1/sites/${encodeURIComponent(siteId)}`
}

/** The site calls, all through the one gateway. */
export function sitesSource(gateway: Gateway) {
  return {
    async sites(): Promise<readonly SiteManifestState[]> {
      const list = await gateway.request<{ sites: SiteManifestState[] }>({
        path: "/v1/sites",
      })
      return required(list).sites
    },
    async manifest(siteId: string): Promise<ActiveSiteManifest> {
      return required(
        await gateway.request<ActiveSiteManifest>({
          path: `${site(siteId)}/manifest`,
        })
      )
    },
    async approve(manifest: ActiveSiteManifest): Promise<SiteApproval> {
      return required(
        await gateway.request<SiteApproval>({
          path: `${site(manifest.site_id)}/manifest/approval`,
          method: "POST",
          body: { manifest_sha256: manifest.manifest_sha256 },
        })
      )
    },
    async withdraw(siteId: string): Promise<SiteApproval> {
      return required(
        await gateway.request<SiteApproval>({
          path: `${site(siteId)}/manifest/approval`,
          method: "DELETE",
        })
      )
    },
    /** A single-use code that signs the owner in on the site. */
    async signInCode(
      siteId: string,
      request: SignInCodeRequest
    ): Promise<SignInCodeIssued> {
      return required(
        await gateway.request<SignInCodeIssued>({
          path: `${site(siteId)}/sign-in-codes`,
          method: "POST",
          body: request,
        })
      )
    },
  }
}

export type SitesSource = ReturnType<typeof sitesSource>

/** The approval state of a site, as display text. */
export const APPROVAL_TEXT: Readonly<Record<string, string>> = {
  unapproved: "Not approved",
  approved: "Approved",
  withdrawn: "Withdrawn",
}

/** The sentence about the active manifest of a site, if one applies. */
export function manifestNote(site: SiteManifestState): string | null {
  const submitted = site.submitted_manifest_sha256 ?? null
  if (submitted === null) return "No manifest is submitted."
  if (submitted !== (site.approved_manifest_sha256 ?? null))
    return "A new manifest waits for approval."
  return null
}

const MESSAGES: Readonly<Record<string, string>> = {
  "platform.site.manifest_digest_stale":
    "A newer manifest became active after this page loaded it. Examine the new manifest, then approve it.",
  "platform.site.hostname_taken":
    "Another approved site has this hostname. Change the hostname in the manifest, or withdraw the other site.",
  "edge.upstream_unavailable":
    "The server could not reach the sites service. Try again later.",
  "edge.upstream_timeout":
    "The sites service did not answer in time. Try again later.",
  "edge.upstream_invalid_response":
    "The sites service gave an answer that the server cannot use. Try again later.",
}

const KIND_MESSAGES: Readonly<Record<string, string>> = {
  offline: "You are offline. Connect to the network and try again.",
  unauthenticated: "Your session ended. Sign in again.",
  revoked: "Your session was revoked. Sign in again.",
  forbidden: "Only the owner of this server can manage sites.",
  "not-found":
    "The server does not know this site, or the site has no manifest.",
}

/**
 * One user-safe sentence for a failure. It reads only the stable code and
 * the kind, never a request value.
 */
export function describeSitesFailure(failure: unknown, fallback: string) {
  if (typeof failure !== "object" || failure === null) return fallback
  const { code, kind } = failure as { code?: unknown; kind?: unknown }
  if (typeof code === "string" && code in MESSAGES) return MESSAGES[code]
  if (typeof kind === "string" && kind in KIND_MESSAGES)
    return KIND_MESSAGES[kind]
  return fallback
}
