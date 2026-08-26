export const SEARCH_MODES = ["auto", "keyword", "semantic"] as const

export type SearchMode = (typeof SEARCH_MODES)[number]

export interface SearchState {
  query: string
  mode: SearchMode
  tag: string
  page: number
}

export type SearchStateChange = Partial<
  Pick<SearchState, "query" | "mode" | "tag">
> &
  Pick<Partial<SearchState>, "page">

export function parseSearchState(
  search: string,
  modes: readonly SearchMode[] = SEARCH_MODES
): SearchState {
  const parameters = new URLSearchParams(search)

  return {
    query: parameters.get("q")?.trim() ?? "",
    mode: availableMode(parameters.get("mode"), modes),
    tag: parameters.get("tag")?.trim() ?? "",
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

// eslint-disable-next-line complexity -- each independently addressable field resets pagination.
export function searchStateHref(
  current: SearchState,
  change: SearchStateChange
): string {
  const state = { ...current, ...change }
  const changedQuery =
    change.query !== undefined && change.query !== current.query
  const changedMode = change.mode !== undefined && change.mode !== current.mode
  const changedTag = change.tag !== undefined && change.tag !== current.tag
  const page = changedQuery || changedMode || changedTag ? 1 : (state.page ?? 1)
  const parameters = new URLSearchParams()

  if (state.query) parameters.set("q", state.query)
  parameters.set("mode", state.mode)
  if (state.tag) parameters.set("tag", state.tag)
  if (page > 1) parameters.set("page", String(page))

  return `/?${parameters.toString()}`
}
