import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"
import GitVaultPage from "@/features/github-vault/git-vault-page"
import { createFixtureGitHubVaultSource } from "@/features/github-vault/github-vault-source"

function renderVault(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/vault"
          element={<GitVaultPage source={createFixtureGitHubVaultSource()} />}
        />
        <Route
          path="/vault/:mirrorId"
          element={<GitVaultPage source={createFixtureGitHubVaultSource()} />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe("GitVaultPage", () => {
  it("renders mirror health and supplied manifest digests", async () => {
    renderVault("/vault/mirror-ratatoskr-web")

    expect(
      await screen.findByText(/mirror health: healthy/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/sha256:5d11b3b68dfe9a80/i)).toBeInTheDocument()
  })

  it("renders passed and failed restore drill evidence without inferring verification", async () => {
    renderVault("/vault/mirror-ratatoskr-web")

    expect(
      await screen.findByText(/restore verified by this passing drill/i)
    ).toBeInTheDocument()
    cleanup()
    renderVault("/vault/mirror-archive-fixtures")
    expect(
      await screen.findByText(/restore was not verified/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/restore verified by this passing drill/i)
    ).not.toBeInTheDocument()
  })
})
