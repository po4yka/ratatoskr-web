import { Link } from "react-router"
import type { ArchiveSearchPage } from "@/features/search/archive-source"
import { HighlightedSnippet } from "@/features/search/snippet"
import { Button } from "@/components/ui/button"

interface SearchResultsProps {
  onPageChange: (page: number) => void
  page: ArchiveSearchPage
  query: string
}

export function SearchResults({
  onPageChange,
  page,
  query,
}: SearchResultsProps) {
  if (!page.results.length) {
    return (
      <section
        className="rounded-xl border border-border bg-card p-5 shadow-subtle"
        role="status"
      >
        <h2 className="text-subheading font-semibold">No results</h2>
        <p className="mt-2 text-body text-muted-foreground">
          Try a different term or search mode.
        </p>
      </section>
    )
  }

  return (
    <section aria-label="Search results" className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3" role="list">
        {page.results.map((result) => (
          <li
            className="rounded-xl border border-border bg-card p-5 shadow-subtle"
            key={result.documentId}
          >
            <Link
              className="inline-flex min-h-7 items-center text-subheading font-semibold underline-offset-4 hover:underline"
              to={`/documents/${result.documentId}`}
            >
              {result.title}
            </Link>
            <p className="mt-2 text-caption text-muted-foreground">
              {result.matchExplanation}
            </p>
            <div className="mt-2">
              <HighlightedSnippet query={query} snippet={result.snippet} />
            </div>
            <ul
              aria-label="Tags"
              className="mt-3 flex flex-wrap gap-2"
              role="list"
            >
              {result.tags.map((tag) => (
                <li
                  className="rounded-lg bg-muted px-2 py-0.5 text-caption"
                  key={tag}
                >
                  {tag}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <nav aria-label="Search pagination" className="flex items-center gap-3">
        <Button
          disabled={page.page === 1}
          onClick={() => onPageChange(page.page - 1)}
          variant="outline"
        >
          Previous
        </Button>
        <p aria-live="polite" className="text-body text-muted-foreground">
          Page {page.page} of {page.pageCount}
        </p>
        <Button
          disabled={page.page === page.pageCount}
          onClick={() => onPageChange(page.page + 1)}
          variant="outline"
        >
          Next
        </Button>
      </nav>
    </section>
  )
}
