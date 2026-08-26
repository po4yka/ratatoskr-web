import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { HighlightedSnippet } from "@/features/search/snippet"

describe("HighlightedSnippet", () => {
  it("highlights every literal case-insensitive match", () => {
    const { container } = render(
      <HighlightedSnippet
        query="document"
        snippet="Document IR keeps each document qualified."
      />
    )

    expect(container.querySelectorAll("mark")).toHaveLength(2)
    expect(screen.getByText(/IR keeps each/i)).toBeInTheDocument()
  })

  it("treats regular expression characters as text", () => {
    const { container } = render(
      <HighlightedSnippet
        query="a.b"
        snippet="a.b is literal; axb is not; A.B again."
      />
    )

    expect(container.querySelectorAll("mark")).toHaveLength(2)
    expect(screen.getByText(/axb is not/i)).toBeInTheDocument()
  })
})
