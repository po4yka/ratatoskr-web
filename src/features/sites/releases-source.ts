import type { Gateway } from "@/api/gateway/client"

/*
 * The release shapes of workspace change add-site-publications.
 *
 * `POST /v1/sites/{site}/releases` is the build request of Platform 3a47f0f
 * (crates/public-api/src/site_releases.rs, schema SiteReleaseBuildAccepted):
 * no body, an `Idempotency-Key`, and `202` with the operation to follow.
 *
 * Edge forwards `GET /v1/sites/{site}/releases` to ratatoskr-sites as a
 * management route, and the sites service does not serve it yet. The names
 * of a release are the columns of `sites.releases`; the failed builds are the
 * failed `sites.release.build` operations of the site.
 */

/** One immutable release of a site. */
export interface SiteRelease {
  /** The SHA-256 of the canonical release document. */
  readonly release_id: string
  readonly built_at: string
  readonly page_count: number
}

/** One build of the site that failed, with the code of its operation. */
export interface FailedBuild {
  readonly operation_id: string
  readonly failed_at: string
  readonly code: string
  readonly message?: string
}

/** `GET /v1/sites/{site}/releases`. */
export interface ReleaseHistory {
  /** `null` until the first release is built. */
  readonly current_release_id: string | null
  /** The releases, newest first. */
  readonly releases: readonly SiteRelease[]
  readonly failed_builds: readonly FailedBuild[]
}

/** The `202` answer of a build request. */
export interface BuildAccepted {
  readonly operation_id: string
  readonly status: string
}

function releases(siteId: string): string {
  return `/v1/sites/${encodeURIComponent(siteId)}/releases`
}

/** The release calls, all through the one gateway. */
export function releasesSource(gateway: Gateway) {
  return {
    async history(siteId: string): Promise<ReleaseHistory> {
      const answer = await gateway.request<ReleaseHistory>({
        path: releases(siteId),
      })
      if (answer === undefined) throw new Error("The history was empty.")
      return answer
    },
    async build(input: {
      readonly siteId: string
      readonly key: string
    }): Promise<BuildAccepted> {
      const answer = await gateway.request<BuildAccepted>({
        path: releases(input.siteId),
        method: "POST",
        headers: { "Idempotency-Key": input.key },
      })
      if (answer === undefined) throw new Error("The build answer was empty.")
      return answer
    },
  }
}

export type ReleasesSource = ReturnType<typeof releasesSource>

const BUILD_FAILURES: Readonly<Record<string, string>> = {
  "sites.slug_collision":
    "Two selected files have the same slug. Give one of them a slug in its frontmatter, or exclude one of them.",
  "sites.publication_suspended":
    "The vault of a publication is disconnected. Connect the vault again, then request a build.",
}

/** One sentence for the code of a failed build, or `null` for an unknown code. */
export function describeBuildFailure(code: string): string | null {
  return BUILD_FAILURES[code] ?? null
}
