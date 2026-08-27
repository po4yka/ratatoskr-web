import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"
import { GatewayProvider } from "@/api/gateway/context"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import { CapabilitiesProvider } from "@/capabilities/capabilities-context"
import CapturePage from "./capture-page"

function renderCapture(run: (request: GatewayRequest) => Promise<unknown>) {
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

describe("capture page", () => {
  it("does not fetch or submit capture work when the capability is absent", async () => {
    const request = vi.fn(async (request: GatewayRequest) => {
      if (request.path === "/v1/capabilities") return { capabilities: [] }
      return { operations: [], next_cursor: null }
    })
    renderCapture(request)

    expect(
      await screen.findByText(/this deployment cannot capture urls/i)
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(request.mock.calls.map(([call]) => call.path)).not.toContain(
        "/v1/operations"
      )
    )
    expect(request.mock.calls.map(([call]) => call.path)).not.toContain(
      "/v1/captures"
    )
  })

  it("blocks an invalid URL before submitting", async () => {
    const request = vi.fn(async (request: GatewayRequest) =>
      request.path === "/v1/capabilities"
        ? { capabilities: ["content.submit"] }
        : { operations: [], next_cursor: null }
    )
    renderCapture(request)
    await screen.findByRole("heading", { name: /capture by url/i })
    fireEvent.change(screen.getByLabelText(/^url$/i), {
      target: { value: "file:///private" },
    })
    fireEvent.click(screen.getByRole("button", { name: /capture url/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/http/i)
    expect(request.mock.calls.map(([call]) => call.path)).not.toContain(
      "/v1/captures"
    )
  })

  it("retries a lost submission with its original idempotency key", async () => {
    const submitKeys: string[] = []
    let calls = 0
    renderCapture(async (request) => {
      if (request.path === "/v1/capabilities") {
        return { capabilities: ["content.submit"] }
      }
      if (request.path === "/v1/operations")
        return { operations: [], next_cursor: null }
      submitKeys.push(request.headers?.["Idempotency-Key"] ?? "")
      calls += 1
      if (calls === 1) throw new Error("terminal failure")
      return { operation_id: "operation-2", status: "accepted" }
    })
    await screen.findByRole("heading", { name: /capture by url/i })
    fireEvent.change(screen.getByLabelText(/^url$/i), {
      target: { value: "https://example.test/article" },
    })
    fireEvent.click(screen.getByRole("button", { name: /capture url/i }))
    fireEvent.click(
      await screen.findByRole("button", { name: /retry submission/i })
    )
    await waitFor(() => expect(calls).toBe(2))
    expect(submitKeys[1]).toBe(submitKeys[0])
  })
})
