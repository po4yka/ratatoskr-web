import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it, vi } from "vitest"
import GitHubCatalogPage from "@/features/github-vault/github-catalog-page"
import {
  fixtureGitHubVaultSnapshot,
  type GitHubVaultSource,
} from "@/features/github-vault/github-vault-source"

function sourceOf(over: Partial<GitHubVaultSource> = {}): GitHubVaultSource {
  return {
    read: () => Promise.resolve(fixtureGitHubVaultSnapshot),
    connectPat: () => Promise.resolve(fixtureGitHubVaultSnapshot),
    mutate: () => Promise.resolve(fixtureGitHubVaultSnapshot),
    ...over,
  }
}

function renderCatalog(source: GitHubVaultSource, path = "/github") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/github" element={<GitHubCatalogPage source={source} />} />
        <Route
          path="/github/:repositoryId"
          element={<GitHubCatalogPage source={source} />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe("GitHubCatalogPage", () => {
  it("rejects an empty PAT before calling the source", async () => {
    const connectPat = vi.fn(() => Promise.resolve(fixtureGitHubVaultSnapshot))
    renderCatalog(sourceOf({ connectPat }))

    fireEvent.click(
      await screen.findByRole("button", { name: /connect with token/i })
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /token is required/i
    )
    expect(connectPat).not.toHaveBeenCalled()
  })

  it("submits a valid PAT exactly once without echoing it", async () => {
    const connectPat = vi.fn(() => Promise.resolve(fixtureGitHubVaultSnapshot))
    renderCatalog(sourceOf({ connectPat }))

    fireEvent.change(await screen.findByLabelText(/personal access token/i), {
      target: { value: "ghp_never_render_this" },
    })
    fireEvent.click(screen.getByRole("button", { name: /connect with token/i }))

    await waitFor(() => expect(connectPat).toHaveBeenCalledTimes(1))
    expect(connectPat).toHaveBeenCalledWith("ghp_never_render_this")
    expect(screen.getByLabelText(/personal access token/i)).toHaveValue("")
    expect(document.body).not.toHaveTextContent("ghp_never_render_this")
  })

  it("offers the supplied OAuth PKCE redirect", async () => {
    renderCatalog(sourceOf())

    expect(await screen.findByRole("link", { name: /oauth/i })).toHaveAttribute(
      "href",
      "https://edge.example/oauth/github/authorize?flow=pkce"
    )
  })

  it("renders supplied repository state and does not synthesize absent analysis", async () => {
    renderCatalog(sourceOf(), "/github/archive-fixtures")

    expect(
      await screen.findByRole("heading", { name: "ratatoskr/archive-fixtures" })
    ).toBeInTheDocument()
    expect(screen.getByText(/state/i).parentElement).toHaveTextContent(
      /starred/i
    )
    expect(screen.getByText(/no analysis was supplied/i)).toBeInTheDocument()
  })

  it("does not change repository state when confirmation is cancelled", async () => {
    const mutate = vi.fn(() => Promise.resolve(fixtureGitHubVaultSnapshot))
    renderCatalog(sourceOf({ mutate }), "/github/archive-fixtures")

    fireEvent.click(
      await screen.findByRole("button", {
        name: /track ratatoskr\/archive-fixtures/i,
      })
    )
    const dialog = await screen.findByRole("alertdialog")
    fireEvent.click(
      within(dialog).getByRole("button", { name: /keep current state/i })
    )

    expect(mutate).not.toHaveBeenCalled()
  })

  it("changes the named repository only after confirmation", async () => {
    const mutate = vi.fn(() => Promise.resolve(fixtureGitHubVaultSnapshot))
    renderCatalog(sourceOf({ mutate }), "/github/archive-fixtures")

    fireEvent.click(
      await screen.findByRole("button", {
        name: /track ratatoskr\/archive-fixtures/i,
      })
    )
    const dialog = await screen.findByRole("alertdialog")
    fireEvent.click(
      within(dialog).getByRole("button", {
        name: /track ratatoskr\/archive-fixtures/i,
      })
    )

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate).toHaveBeenCalledWith({
      kind: "set-tracked",
      repositoryId: "archive-fixtures",
      value: true,
    })
  })
})
