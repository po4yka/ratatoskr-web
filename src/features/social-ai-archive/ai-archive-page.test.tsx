import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"
import AiArchivePage from "@/features/social-ai-archive/ai-archive-page"
import {
  fixtureSocialAiArchiveSnapshot,
  type SocialAiArchiveSource,
} from "@/features/social-ai-archive/archive-source"

function renderArchive(path: string, source?: SocialAiArchiveSource) {
  cleanup()
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/archives/:provider/:view?/:itemId?"
          element={<AiArchivePage source={source} />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe("AiArchivePage", () => {
  it("renders import status and completeness gaps", async () => {
    renderArchive("/archives/claude")

    expect(await screen.findByText(/partial import/i)).toBeInTheDocument()
    expect(screen.getByText(/missing_file/i)).toBeInTheDocument()
    expect(screen.queryByText(/archive complete/i)).not.toBeInTheDocument()
  })

  it("renders a fixture export conversation in supplied message and content-part order", async () => {
    renderArchive("/archives/chatgpt/conversations/chatgpt-conversation-1")

    expect(
      await screen.findByRole("heading", { name: /document import review/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/show the import result/i)).toBeInTheDocument()
    expect(screen.getByText("status = 'imported'")).toBeInTheDocument()
    expect(
      screen.getByText(/attachment: import-manifest.json/i)
    ).toBeInTheDocument()
  })

  it("renders an explicit empty state when no provider imports are supplied", async () => {
    const source: SocialAiArchiveSource = {
      disconnect: () => Promise.resolve(fixtureSocialAiArchiveSnapshot),
      read: () =>
        Promise.resolve({ ...fixtureSocialAiArchiveSnapshot, imports: [] }),
    }
    renderArchive("/archives/chatgpt", source)

    expect(
      await screen.findByText(/no imports are available/i)
    ).toBeInTheDocument()
  })

  it("renders an explicit empty state when no provider projects are supplied", async () => {
    const source: SocialAiArchiveSource = {
      disconnect: () => Promise.resolve(fixtureSocialAiArchiveSnapshot),
      read: () =>
        Promise.resolve({ ...fixtureSocialAiArchiveSnapshot, projects: [] }),
    }
    renderArchive("/archives/chatgpt", source)

    expect(
      await screen.findByText(/no projects are available/i)
    ).toBeInTheDocument()
  })
})
