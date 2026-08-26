interface HighlightedSnippetProps {
  snippet: string
  query: string
}

import { splitSnippet } from "@/features/search/snippet-segments"

export function HighlightedSnippet({
  snippet,
  query,
}: HighlightedSnippetProps) {
  return (
    <p className="text-body text-muted-foreground">
      {splitSnippet(snippet, query).map((segment, index) =>
        segment.matched ? (
          <mark
            className="rounded-sm bg-muted px-0.5 font-medium text-foreground"
            key={`${segment.text}-${index}`}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        )
      )}
    </p>
  )
}
