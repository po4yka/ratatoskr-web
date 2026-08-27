import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import { GatewayProvider } from "@/api/gateway/context"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import { CapabilitiesProvider } from "@/capabilities/capabilities-context"
import CapturePage from "./capture-page"

function renderLibrary(run: (request: GatewayRequest) => Promise<unknown>) {
  const gateway: Gateway = { request: run as Gateway["request"] }
  return render(
    <MemoryRouter>
      <GatewayProvider gateway={gateway}>
        <CapabilitiesProvider gateway={gateway}>
          <CapturePage />
        </CapabilitiesProvider>
      </GatewayProvider>
    </MemoryRouter>
  )
}

function captureList(request: GatewayRequest) {
  expect(request).toMatchObject({
    path: "/v1/operations",
    query: { kind: "content.capture.submit", limit: 20 },
  })
  return {
    next_cursor: null,
    operations: [
      {
        accepted_at: "2026-08-27T00:00:00Z",
        correlation_id: "operation:recent",
        kind: "content.capture.submit",
        operation_id: "operation-recent",
        retryable: false,
        stage: "extracting",
        status: "running",
        status_changed_at: "2026-08-27T00:00:00Z",
      },
    ],
  }
}

describe("capture library", () => {
  it("renders one bounded page of recent captures", async () => {
    renderLibrary(async (request) =>
      request.path === "/v1/capabilities"
        ? { capabilities: ["content.submit"] }
        : captureList(request)
    )

    expect(await screen.findByText("extracting")).toBeInTheDocument()
  })

  it("marks read and favorite as local presentation state", async () => {
    renderLibrary(async (request) =>
      request.path === "/v1/capabilities"
        ? { capabilities: ["content.submit"] }
        : captureList(request)
    )

    const read = await screen.findByRole("button", { name: /mark read/i })
    const favorite = screen.getByRole("button", { name: /^favorite$/i })
    fireEvent.click(read)
    fireEvent.click(favorite)
    expect(read).toHaveAttribute("aria-pressed", "true")
    expect(favorite).toHaveAttribute("aria-pressed", "true")
  })
})
