import { useEffect, useMemo, useState } from "react"
import { useGateway } from "@/api/gateway/context"
import type { NotesConnection } from "@/features/notes/notes-source"
import { PublicationEditor } from "./publication-editor"
import {
  NEW_PUBLICATION,
  publicationsSource,
  type Publication,
} from "./publications-source"
import { describeSitesFailure } from "./sites-source"

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | {
      readonly kind: "ready"
      readonly stored: readonly Publication[]
      readonly vaults: readonly NotesConnection[]
      readonly vaultProblem: string | null
    }

/** The editors of the publications that the active manifest names. */
export function PublicationsSection({
  siteId,
  names,
}: {
  readonly siteId: string
  readonly names: readonly string[]
}) {
  const gateway = useGateway()
  const source = useMemo(() => publicationsSource(gateway), [gateway])
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" })
  useEffect(() => {
    let alive = true
    const vaults = source.vaults().then(
      (list) => ({ list, problem: null }),
      () => ({ list: [], problem: "The vault connections could not load." })
    )
    Promise.all([source.publications(siteId), vaults]).then(
      ([stored, { list, problem }]) =>
        alive &&
        setLoaded({
          kind: "ready",
          stored,
          vaults: list,
          vaultProblem: problem,
        }),
      (failure: unknown) =>
        alive &&
        setLoaded({
          kind: "failed",
          message: describeSitesFailure(
            failure,
            "The publications could not load."
          ),
        })
    )
    return () => {
      alive = false
    }
  }, [source, siteId])

  return (
    <section
      aria-labelledby="site-publications-heading"
      className="flex flex-col gap-4"
    >
      <h2
        className="text-heading-sm font-semibold"
        id="site-publications-heading"
      >
        Publications
      </h2>
      {loaded.kind === "loading" ? (
        <p role="status">Loading the publications</p>
      ) : null}
      {loaded.kind === "failed" ? (
        <p className="text-body text-destructive" role="alert">
          {loaded.message}
        </p>
      ) : null}
      {loaded.kind === "ready" ? (
        <>
          {loaded.vaultProblem === null ? null : (
            <p className="text-body text-destructive" role="alert">
              {loaded.vaultProblem}
            </p>
          )}
          {names.map((name) => (
            <PublicationEditor
              key={name}
              onSave={(settings) =>
                source.save({ siteId, publicationId: name, settings })
              }
              publicationId={name}
              settings={
                loaded.stored.find((entry) => entry.publication_id === name) ??
                NEW_PUBLICATION
              }
              vaults={loaded.vaults}
            />
          ))}
        </>
      ) : null}
    </section>
  )
}
