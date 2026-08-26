export interface SnippetSegment {
  text: string
  matched: boolean
}

export function splitSnippet(snippet: string, query: string): SnippetSegment[] {
  const literalQuery = query.trim()
  if (!literalQuery) return [{ text: snippet, matched: false }]

  const needle = literalQuery.toLocaleLowerCase()
  const haystack = snippet.toLocaleLowerCase()
  const segments: SnippetSegment[] = []
  let cursor = 0
  let matchAt = haystack.indexOf(needle, cursor)

  while (matchAt !== -1) {
    if (matchAt > cursor) {
      segments.push({ text: snippet.slice(cursor, matchAt), matched: false })
    }
    segments.push({
      text: snippet.slice(matchAt, matchAt + literalQuery.length),
      matched: true,
    })
    cursor = matchAt + literalQuery.length
    matchAt = haystack.indexOf(needle, cursor)
  }

  if (cursor < snippet.length) {
    segments.push({ text: snippet.slice(cursor), matched: false })
  }

  return segments.length ? segments : [{ text: snippet, matched: false }]
}
