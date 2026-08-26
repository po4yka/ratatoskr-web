import { act, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import { gatewayOf } from "@/test/app-harness"
import { fullDeployment } from "./capability-fixtures"
import { CapabilitiesProvider, useCapabilities } from "./capabilities-context"

/**
 * A probe component the tests render inside the provider to read what the
 * context actually exposes.
 */
function Probe() {
  const { status, document, retry } = useCapabilities()
  return (
    <section>
      <p>status: {status}</p>
      <p>capabilities: {document ? document.capabilities.join(",") : "none"}</p>
      <button onClick={retry}>retry discovery</button>
    </section>
  )
}

describe("CapabilitiesProvider", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/")
  })

  it("reads the document through the gateway and holds it", async () => {
    const requests: GatewayRequest[] = []
    const gateway: Gateway = gatewayOf((request) => {
      requests.push(request)
      return Promise.resolve(fullDeployment)
    })

    render(
      <CapabilitiesProvider gateway={gateway}>
        <Probe />
      </CapabilitiesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("status: ready")).toBeInTheDocument()
    })
    expect(
      screen.getByText(`capabilities: ${fullDeployment.capabilities.join(",")}`)
    ).toBeInTheDocument()
    expect(requests).toHaveLength(1)
    expect(requests[0]?.path).toBe("/v1/capabilities")
    expect(requests[0]?.method ?? "GET").toBe("GET")
  })

  it("a failed read leaves no document and retry re-reads", async () => {
    let failing = true
    let reads = 0
    const gateway: Gateway = gatewayOf(() => {
      reads += 1
      return failing
        ? Promise.reject({ kind: "offline" })
        : Promise.resolve(fullDeployment)
    })

    render(
      <CapabilitiesProvider gateway={gateway}>
        <Probe />
      </CapabilitiesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("status: failed")).toBeInTheDocument()
    })
    expect(screen.getByText("capabilities: none")).toBeInTheDocument()

    failing = false
    await act(async () => {
      screen.getByRole("button", { name: /retry discovery/i }).click()
    })

    await waitFor(() => {
      expect(screen.getByText("status: ready")).toBeInTheDocument()
    })
    expect(reads).toBe(2)
  })

  it("connectivity restored re-reads the document", async () => {
    let reads = 0
    const gateway: Gateway = gatewayOf(() => {
      reads += 1
      return Promise.resolve(fullDeployment)
    })

    render(
      <CapabilitiesProvider gateway={gateway}>
        <Probe />
      </CapabilitiesProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("status: ready")).toBeInTheDocument()
    })
    expect(reads).toBe(1)

    await act(async () => {
      window.dispatchEvent(new Event("online"))
    })

    await waitFor(() => {
      expect(reads).toBe(2)
    })
    expect(screen.getByText("status: ready")).toBeInTheDocument()
  })
})
