import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router"
import { ManifestApproval } from "./manifest-approval"
import { PublicationsSection } from "./publications-section"
import { ReleaseHistory } from "./release-history"
import {
  describeSitesFailure,
  type ActiveSiteManifest,
  type SiteManifestState,
  type SitesSource,
} from "./sites-source"

type ViewState =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | {
      readonly kind: "ready"
      readonly site: SiteManifestState
      readonly manifest: ActiveSiteManifest
    }

/** The registry entry and the active manifest of one site, read together. */
async function readSite(
  source: SitesSource,
  siteId: string
): Promise<ViewState> {
  const [sites, manifest] = await Promise.all([
    source.sites(),
    source.manifest(siteId),
  ])
  const site = sites.find((entry) => entry.site_id === siteId) ?? {
    site_id: siteId,
    submitted_manifest_sha256: manifest.manifest_sha256,
    approved_manifest_sha256: null,
    approval_state: "unapproved",
  }
  return { kind: "ready", site, manifest }
}

/** `/sites/:siteId`: the manifest of one site and its approval. */
export function SiteView({
  siteId,
  source,
}: {
  readonly siteId: string
  readonly source: SitesSource
}) {
  const [state, setState] = useState<ViewState>({ kind: "loading" })
  const reload = useCallback(() => {
    readSite(source, siteId).then(setState, (failure: unknown) =>
      setState({
        kind: "failed",
        message: describeSitesFailure(failure, "The site could not load."),
      })
    )
  }, [source, siteId])
  useEffect(reload, [reload])

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <Link className="text-body underline" to="/sites">
          All sites
        </Link>
        <h1 className="mt-2 text-heading font-semibold">{siteId}</h1>
      </header>
      {state.kind === "loading" ? <p role="status">Loading the site</p> : null}
      {state.kind === "failed" ? (
        <p className="text-body text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.kind === "ready" ? (
        <>
          <ManifestApproval
            manifest={state.manifest}
            onChanged={reload}
            site={state.site}
            source={source}
          />
          <PublicationsSection
            names={state.manifest.publications}
            siteId={siteId}
          />
          <ReleaseHistory
            approved={state.site.approval_state === "approved"}
            siteId={siteId}
          />
        </>
      ) : null}
    </section>
  )
}
