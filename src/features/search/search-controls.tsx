import type { SearchMode, SearchState } from "@/features/search/search-state"
import { Input } from "@/components/ui/input"

interface SearchControlsProps {
  modes: readonly SearchMode[]
  onChange: (change: Partial<Pick<SearchState, "query" | "mode">>) => void
  state: SearchState
}

export function SearchControls({
  modes,
  onChange,
  state,
}: SearchControlsProps) {
  return (
    <section
      aria-label="Search controls"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-subtle sm:flex-row"
      role="search"
    >
      <label
        className="flex min-w-0 flex-1 flex-col gap-1.5"
        htmlFor="archive-search"
      >
        <span className="text-caption font-medium">Search archive</span>
        <Input
          id="archive-search"
          onChange={(event) => onChange({ query: event.target.value })}
          type="search"
          value={state.query}
        />
      </label>
      <label className="flex flex-col gap-1.5" htmlFor="search-mode">
        <span className="text-caption font-medium">Search mode</span>
        <select
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-body outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          id="search-mode"
          onChange={(event) =>
            onChange({ mode: event.target.value as SearchMode })
          }
          value={state.mode}
        >
          {modes.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
