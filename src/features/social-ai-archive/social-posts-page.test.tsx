import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"
import SocialPostsPage from "@/features/social-ai-archive/social-posts-page"

function renderSocial(path: string) {
  cleanup()
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/social/:provider/:postId?"
          element={<SocialPostsPage />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe("SocialPostsPage", () => {
  it("maps bookmark snapshot explicit capture and import provenance badges", async () => {
    renderSocial("/social/x")
    expect(await screen.findByText(/bookmark snapshot/i)).toBeInTheDocument()

    renderSocial("/social/instagram")
    expect(await screen.findByText(/^explicit capture$/i)).toBeInTheDocument()

    renderSocial("/social/threads")
    expect(await screen.findByText(/^import$/i)).toBeInTheDocument()
  })

  it("filters by supplied folder", async () => {
    renderSocial("/social/x")
    fireEvent.change(await screen.findByLabelText(/folder/i), {
      target: { value: "x-reading" },
    })

    expect(
      screen.getByText(/saved post with an extracted article/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/not in a folder/i)).not.toBeInTheDocument()
  })

  it("links only a post with supplied Document IR", async () => {
    renderSocial("/social/x/x-bookmark")
    expect(
      await screen.findByRole("link", { name: /open extracted article/i })
    ).toHaveAttribute("href", "/documents/document-contracts")

    renderSocial("/social/threads/threads-import")
    expect(
      screen.queryByRole("link", { name: /extracted article/i })
    ).not.toBeInTheDocument()
  })
})
