import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"

const accepting = () => Promise.resolve({ capabilities: [] })

describe("lazily loaded feature routes", () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.history.replaceState(null, "", "/")
  })

  it("shows the route's pending state while its module arrives, then its view", async () => {
    storeCustody("credential-1")

    // A module that has not finished arriving yet.
    let releaseModule!: (payload: unknown) => void
    const arrival = new Promise((resolve) => {
      releaseModule = resolve
    })
    const slowSearch = () =>
      arrival.then(
        () =>
          Promise.resolve({
            default: () => <p>search arrived</p>,
          }),
        () => ({ default: () => <p>failed</p> })
      )

    renderApp({
      gateway: gatewayOf(accepting),
      routeModules: { search: slowSearch },
    })

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })

    // The shell is up; the route region holds a designed pending state, not
    // a blank area and not another route's content.
    const pending = screen.getByRole("status")
    expect(pending).toHaveTextContent(/loading/i)
    expect(screen.queryByText(/search arrived/i)).not.toBeInTheDocument()

    releaseModule({ capabilities: [] })

    await waitFor(() => {
      expect(screen.getByText(/search arrived/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("navigating between feature routes holds the previous view until the next one is ready", async () => {
    storeCustody("credential-1")

    let releaseCollections!: (payload: unknown) => void
    const collectionsArrival = new Promise((resolve) => {
      releaseCollections = resolve
    })
    const slowCollections = () =>
      collectionsArrival.then(() => ({
        default: () => <p>collections arrived</p>,
      }))

    renderApp({
      gateway: gatewayOf(accepting),
      routeModules: { collections: slowCollections },
    })

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
    // The default route modules are dynamic imports too, so the index view
    // arrives asynchronously as well.
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /search your archive/i })
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("link", { name: /collections/i }))

    // The navigation is a transition: the previous view is held, never a
    // blank region, while the next module arrives.
    releaseCollections({ capabilities: [] })
    await waitFor(() => {
      expect(screen.getByText(/collections arrived/i)).toBeInTheDocument()
    })
    expect(screen.getByRole("banner")).toBeInTheDocument()
    expect(window.location.pathname).toBe("/collections")
  })
})
