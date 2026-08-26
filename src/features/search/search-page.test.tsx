import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router"
import { afterEach, describe, expect, it } from "vitest"
import type { ArchiveSource } from "@/features/search/archive-source"
import SearchPage from "@/features/search/search-page"

const pageSource: ArchiveSource = {
  async search(state) {
    return {
      modes: ["auto", "keyword", "semantic"],
      tags: ["contracts", "provenance"],
      page: state.page,
      pageCount: 3,
      results: [
        {
          documentId: "document-ir",
          title: "Document IR",
          snippet: "Document IR makes document evidence visible.",
          matchExplanation: "Matched title and body text.",
          tags: ["contracts"],
        },
      ],
    }
  },
  async read() {
    return undefined
  },
}

function renderSearch(source: ArchiveSource) {
  return render(
    <BrowserRouter>
      <SearchPage source={source} />
    </BrowserRouter>
  )
}

afterEach(() => {
  window.history.replaceState(null, "", "/")
})

describe("SearchPage", () => {
  it("synchronizes query, mode, and pagination through the URL", async () => {
    window.history.replaceState(null, "", "/?q=document&mode=semantic&page=2")
    renderSearch(pageSource)

    expect(await screen.findByDisplayValue("document")).toBeInTheDocument()
    expect(screen.getByLabelText(/search mode/i)).toHaveValue("semantic")
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/search archive/i), {
      target: { value: "provenance" },
    })

    await waitFor(() => {
      expect(window.location.search).toBe("?q=provenance&mode=semantic")
    })
  })

  it("renders loading, empty, and retryable error states", async () => {
    const loadingSource: ArchiveSource = {
      ...pageSource,
      search: () => new Promise(() => {}),
    }
    const { unmount } = renderSearch(loadingSource)
    expect(screen.getByRole("status")).toHaveTextContent(/loading search/i)
    unmount()

    const emptySource: ArchiveSource = {
      ...pageSource,
      async search() {
        return {
          modes: ["auto"],
          tags: [],
          page: 1,
          pageCount: 1,
          results: [],
        }
      },
    }
    const empty = renderSearch(emptySource)
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/no results/i)
    })
    empty.unmount()

    const errorSource: ArchiveSource = {
      ...pageSource,
      async search() {
        throw new Error("fixture unavailable")
      },
    }
    renderSearch(errorSource)
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not load/i
    )
    expect(screen.getByRole("button", { name: /try again/i })).toBeEnabled()
  })

  it("clearing a tag filter removes it from the URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/?q=document&mode=auto&tag=contracts"
    )
    renderSearch(pageSource)

    expect(await screen.findByLabelText(/tag filter/i)).toHaveValue("contracts")
    fireEvent.change(screen.getByLabelText(/tag filter/i), {
      target: { value: "" },
    })

    await waitFor(() => {
      expect(window.location.search).toBe("?q=document&mode=auto")
    })
  })
})
