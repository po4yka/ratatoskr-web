import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import {
  fixtureArchiveSource,
  type ArchiveSearchPage,
  type ArchiveSource,
} from "@/features/search/archive-source"
import {
  parseSearchState,
  SEARCH_MODES,
  searchStateHref,
  type SearchStateChange,
} from "@/features/search/search-state"
import { SearchControls } from "@/features/search/search-controls"
import { SearchResults } from "@/features/search/search-results"
import { Button } from "@/components/ui/button"

interface SearchPageProps {
  /** Local fixture seam until the generated Knowledge contract exists. */
  source?: ArchiveSource
}

type SearchLoad =
  | { kind: "loading"; requestKey: string }
  | { kind: "ready"; page: ArchiveSearchPage; requestKey: string }
  | { kind: "error"; requestKey: string }

export default function SearchPage({
  source = fixtureArchiveSource,
}: SearchPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const state = parseSearchState(location.search, SEARCH_MODES)
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${state.query}\u0000${state.mode}\u0000${state.tag}\u0000${state.page}\u0000${attempt}`
  const [load, setLoad] = useState<SearchLoad>({
    kind: "loading",
    requestKey,
  })
  const activeLoad: SearchLoad =
    load.requestKey === requestKey ? load : { kind: "loading", requestKey }
  const { mode, page, query, tag } = state

  useEffect(() => {
    let current = true
    source
      .search({ query, mode, tag, page })
      // eslint-disable-next-line complexity -- URL recovery keeps each invalid field distinct.
      .then((searchPage) => {
        if (!current) return
        setLoad({ kind: "ready", page: searchPage, requestKey })
        if (
          searchPage.page !== page ||
          !searchPage.modes.includes(mode) ||
          (tag !== "" && !searchPage.tags.includes(tag))
        ) {
          const safeMode = searchPage.modes.includes(mode)
            ? mode
            : searchPage.modes[0]
          const safeTag = searchPage.tags.includes(tag) ? tag : ""
          if (safeMode) {
            navigate(
              searchStateHref(
                { query, mode: safeMode, tag: safeTag, page: searchPage.page },
                {}
              ),
              {
                replace: true,
              }
            )
          }
        }
      })
      .catch(() => {
        if (current) setLoad({ kind: "error", requestKey })
      })

    return () => {
      current = false
    }
  }, [mode, navigate, page, query, requestKey, source, tag])

  function updateSearch(change: SearchStateChange) {
    navigate(searchStateHref(state, change))
  }

  const availableModes =
    activeLoad.kind === "ready" ? activeLoad.page.modes : SEARCH_MODES
  const availableTags = activeLoad.kind === "ready" ? activeLoad.page.tags : []

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-sm font-semibold">Search your archive</h1>
        <p className="text-body text-muted-foreground">
          Results show the evidence that made each document match.
        </p>
      </header>

      <SearchControls
        modes={availableModes}
        onChange={updateSearch}
        state={state}
        tags={availableTags}
      />

      {activeLoad.kind === "loading" ? <SearchLoading /> : null}
      {activeLoad.kind === "error" ? (
        <section
          className="rounded-xl border border-border bg-card p-5 shadow-subtle"
          role="alert"
        >
          <h2 className="text-subheading font-semibold">
            Search could not load
          </h2>
          <p className="mt-2 text-body text-muted-foreground">
            The archive fixture did not answer. Try the request again.
          </p>
          <Button
            className="mt-4"
            onClick={() => setAttempt((value) => value + 1)}
            variant="outline"
          >
            Try again
          </Button>
        </section>
      ) : null}
      {activeLoad.kind === "ready" ? (
        <SearchResults
          onPageChange={(page) => updateSearch({ page })}
          page={activeLoad.page}
          query={state.query}
        />
      ) : null}
    </section>
  )
}

function SearchLoading() {
  return (
    <section
      aria-busy="true"
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
      role="status"
    >
      <h2 className="text-subheading font-semibold">Loading search</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Looking through your archive without sending its content anywhere else.
      </p>
    </section>
  )
}
