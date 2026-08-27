import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"
import AiArchivePage from "@/features/social-ai-archive/ai-archive-page"

describe("AiArchivePage artifacts", () => {
  it("lists all supplied Claude artifact versions", async () => {
    render(
      <MemoryRouter
        initialEntries={["/archives/claude/artifacts/claude-artifact-reader"]}
      >
        <Routes>
          <Route
            path="/archives/:provider/:view?/:itemId?"
            element={<AiArchivePage />}
          />
        </Routes>
      </MemoryRouter>
    )

    expect(
      await screen.findByRole("heading", { name: /reader implementation/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/Version 1/)).toBeInTheDocument()
    expect(screen.getByText(/Version 2/)).toBeInTheDocument()
  })
})
