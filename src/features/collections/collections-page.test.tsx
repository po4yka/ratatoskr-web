import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { describe, expect, it } from "vitest"
import CollectionsPage from "@/features/collections/collections-page"
import {
  createFixtureCurationSource,
  type CurationSource,
} from "@/features/collections/curation-source"

function renderCollections(path: string, source: CurationSource) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/collections"
          element={<CollectionsPage source={source} />}
        />
        <Route
          path="/collections/:collectionId"
          element={<CollectionsPage source={source} />}
        />
      </Routes>
      <Location />
    </MemoryRouter>
  )
}

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

describe("CollectionsPage", () => {
  it("creates a collection and opens its detail URL", async () => {
    renderCollections("/collections", createFixtureCurationSource())

    fireEvent.change(await screen.findByLabelText(/new collection name/i), {
      target: { value: "Research" },
    })
    fireEvent.click(screen.getByRole("button", { name: /create collection/i }))

    expect(
      await screen.findByRole("heading", { name: "Research" })
    ).toBeInTheDocument()
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/collections/collection-research"
    )
  })

  it("renames a collection", async () => {
    renderCollections("/collections/reading", createFixtureCurationSource())

    const name = await screen.findByLabelText(/collection name/i)
    fireEvent.change(name, { target: { value: "Reference" } })
    fireEvent.click(screen.getByRole("button", { name: /save name/i }))

    expect(
      await screen.findByRole("heading", { name: "Reference" })
    ).toBeInTheDocument()
  })

  it("requires named confirmation before deletion", async () => {
    renderCollections("/collections/reading", createFixtureCurationSource())

    fireEvent.click(
      await screen.findByRole("button", { name: /delete collection/i })
    )

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      /delete reading and remove its saved item list/i
    )
    fireEvent.click(screen.getByRole("button", { name: /delete reading/i }))

    expect(
      await screen.findByRole("heading", { name: /^collections$/i })
    ).toBeInTheDocument()
  })

  it("adds and removes ordered items", async () => {
    renderCollections("/collections/reading", createFixtureCurationSource())

    fireEvent.click(
      await screen.findByRole("button", {
        name: /add search results need match evidence/i,
      })
    )
    expect(
      await screen.findByRole("list", { name: /collection items/i })
    ).toHaveTextContent(
      /document ir: evidence at the boundary.*search results need match evidence/i
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: /remove document ir: evidence at the boundary/i,
      })
    )
    expect(
      screen.getByRole("button", {
        name: /remove search results need match evidence/i,
      })
    ).toBeInTheDocument()
  })
})
