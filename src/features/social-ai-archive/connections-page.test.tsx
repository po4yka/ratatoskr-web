import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"
import ConnectionsPage from "@/features/social-ai-archive/connections-page"
import {
  fixtureSocialAiArchiveSnapshot,
  type SocialAiArchiveSource,
} from "@/features/social-ai-archive/archive-source"

function sourceOf(
  disconnect = vi.fn(() => Promise.resolve(fixtureSocialAiArchiveSnapshot))
) {
  return {
    read: () => Promise.resolve(fixtureSocialAiArchiveSnapshot),
    disconnect,
  } satisfies SocialAiArchiveSource
}

function renderConnections(source: SocialAiArchiveSource) {
  return render(
    <MemoryRouter>
      <ConnectionsPage source={source} />
    </MemoryRouter>
  )
}

describe("ConnectionsPage", () => {
  it("offers only the supplied OAuth authorization URL", async () => {
    renderConnections(sourceOf())
    expect(
      await screen.findByRole("link", { name: /connect x with oauth/i })
    ).toHaveAttribute("href", "https://edge.example/oauth/x/authorize")
  })

  it("explains when authorization is unavailable", async () => {
    renderConnections(sourceOf())
    expect(
      await screen.findByText(/claude authorization cannot start/i)
    ).toBeInTheDocument()
  })

  it("does not disconnect when confirmation is cancelled", async () => {
    const disconnect = vi.fn(() =>
      Promise.resolve(fixtureSocialAiArchiveSnapshot)
    )
    renderConnections(sourceOf(disconnect))
    fireEvent.click(
      await screen.findByRole("button", { name: /disconnect x/i })
    )
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: /keep connected/i,
      })
    )
    expect(disconnect).not.toHaveBeenCalled()
  })

  it("disconnects the named provider exactly once after confirmation", async () => {
    const disconnect = vi.fn(() =>
      Promise.resolve(fixtureSocialAiArchiveSnapshot)
    )
    renderConnections(sourceOf(disconnect))
    fireEvent.click(
      await screen.findByRole("button", { name: /disconnect x/i })
    )
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: /^disconnect x$/i,
      })
    )
    await waitFor(() => expect(disconnect).toHaveBeenCalledWith("x"))
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
