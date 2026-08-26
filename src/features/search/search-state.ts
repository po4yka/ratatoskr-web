export const SEARCH_MODES = ["auto", "keyword", "semantic"] as const

export type SearchMode = (typeof SEARCH_MODES)[number]

export interface SearchState {
  query: string
  mode: SearchMode
  page: number
}

export type SearchStateChange = Partial<Pick<SearchState, "query" | "mode">> &
  Pick<Partial<SearchState>, "page">

export function parseSearchState(
  search: string,
  modes: readonly SearchMode[] = SEARCH_MODES
): SearchState {
  const parameters = new URLSearchParams(search)

  return {
    query: parameters.get("q")?.trim() ?? "",
    mode: availableMode(parameters.get("mode"), modes),
    page: positivePage(parameters.get("page")),
  }
}

function availableMode(
  requested: string | null,
  modes: readonly SearchMode[]
): SearchMode {
  return requested && modes.includes(requested as SearchMode)
    ? (requested as SearchMode)
    : (modes[0] ?? SEARCH_MODES[0])
}

function positivePage(requested: string | null): number {
  const page = Number(requested)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function searchStateHref(
  current: SearchState,
  change: SearchStateChange
): string {
  const state = { ...current, ...change }
  const changedQuery =
    change.query !== undefined && change.query !== current.query
  const changedMode = change.mode !== undefined && change.mode !== current.mode
  const page = changedQuery || changedMode ? 1 : (state.page ?? 1)
  const parameters = new URLSearchParams()

  if (state.query) parameters.set("q", state.query)
  parameters.set("mode", state.mode)
  if (page > 1) parameters.set("page", String(page))

  return `/?${parameters.toString()}`
}
