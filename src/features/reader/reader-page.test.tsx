import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"
import type {
  ArchiveDocument,
  ArchiveSource,
} from "@/features/search/archive-source"
import ReaderPage from "@/features/reader/reader-page"

const degradedDocument: ArchiveDocument = {
  id: "evidence",
  title: "Evidence carries its extraction path",
  sourceAddress: "https://archive.example/evidence",
  extractionPath: "readability → normalized blocks",
  warnings: ["Navigation was excluded.", "Language was not declared."],
  tags: ["provenance", "warnings"],
  analysis: {
    tldr: "Extraction evidence qualifies what the reader sees.",
    keyPoints: ["Show the source.", "Show every warning."],
  },
  blocks: [
    { type: "paragraph", text: "The reader renders source content as text." },
  ],
}

function sourceFor(document: ArchiveDocument): ArchiveSource {
  return {
    async search() {
      return { modes: ["auto"], page: 1, pageCount: 1, results: [] }
    },
    async read() {
      return document
    },
  }
}

function renderReader(document: ArchiveDocument) {
  return render(
    <MemoryRouter initialEntries={[`/documents/${document.id}`]}>
      <Routes>
        <Route
          element={<ReaderPage source={sourceFor(document)} />}
          path="/documents/:documentId"
        />
      </Routes>
    </MemoryRouter>
  )
}

describe("ReaderPage", () => {
  it("renders provenance, extraction warnings, and available analysis", async () => {
    renderReader(degradedDocument)

    expect(
      await screen.findByRole("heading", { name: /evidence carries/i })
    ).toBeInTheDocument()
    expect(screen.getByText(degradedDocument.sourceAddress)).toBeInTheDocument()
    expect(
      screen.getByText(degradedDocument.extractionPath)
    ).toBeInTheDocument()
    expect(screen.getByText("Navigation was excluded.")).toBeInTheDocument()
    expect(screen.getByText("Language was not declared.")).toBeInTheDocument()
    expect(
      screen.getByText(degradedDocument.analysis!.tldr)
    ).toBeInTheDocument()
    expect(screen.getByText("Show every warning.")).toBeInTheDocument()
  })

  it("reports absent analysis without inventing it", async () => {
    const withoutAnalysis = { ...degradedDocument, analysis: undefined }
    renderReader(withoutAnalysis)

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /analysis is not available/i
      )
    })
    expect(
      screen.queryByText(/extraction evidence qualifies/i)
    ).not.toBeInTheDocument()
  })
})
