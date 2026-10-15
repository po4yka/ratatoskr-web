import { useEffect, useState } from "react"
import { Link } from "react-router"
import {
  APPROVAL_TEXT,
  describeSitesFailure,
  manifestNote,
  type SiteManifestState,
  type SitesSource,
} from "./sites-source"

type ListState =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "ready"; readonly sites: readonly SiteManifestState[] }

function SiteItem({ site }: { readonly site: SiteManifestState }) {
  const nameId = `site-${site.site_id}`
  const note = manifestNote(site)
  return (
    <li
      aria-labelledby={nameId}
      className="flex flex-col gap-1 rounded-xl border border-border bg-card p-5 shadow-subtle"
    >
      <Link
        className="text-subheading font-semibold hover:underline"
        id={nameId}
        to={`/sites/${encodeURIComponent(site.site_id)}`}
      >
        {site.site_id}
      </Link>
      <p className="text-body text-muted-foreground">
        Approval: <span>{APPROVAL_TEXT[site.approval_state]}</span>
      </p>
      {note === null ? null : <p className="text-body">{note}</p>}
    </li>
  )
}

function SiteList({ state }: { readonly state: ListState }) {
  if (state.kind === "loading") return <p role="status">Loading the sites</p>
  if (state.kind === "failed")
    return (
      <p className="text-body text-destructive" role="alert">
        {state.message}
      </p>
    )
  if (state.sites.length === 0)
    return (
      <p className="text-body text-muted-foreground">
        No site exists. A site appears here when its manifest is submitted.
      </p>
    )
  return (
    <ul className="flex flex-col gap-3">
      {state.sites.map((site) => (
        <SiteItem key={site.site_id} site={site} />
      ))}
    </ul>
  )
}

/** `/sites`: the owner's sites, each with the state of its manifest. */
export function SiteRegistry({ source }: { readonly source: SitesSource }) {
  const [state, setState] = useState<ListState>({ kind: "loading" })
  useEffect(() => {
    let alive = true
    source.sites().then(
      (sites) => alive && setState({ kind: "ready", sites }),
      (failure: unknown) =>
        alive &&
        setState({
          kind: "failed",
          message: describeSitesFailure(failure, "The sites could not load."),
        })
    )
    return () => {
      alive = false
    }
  }, [source])

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <h1 className="text-heading font-semibold">Sites</h1>
        <p className="mt-2 text-body text-muted-foreground">
          A site serves its publications to the public. A new capability,
          hostname or publication takes effect only after you approve the
          manifest that names it.
        </p>
      </header>
      <SiteList state={state} />
    </section>
  )
}
