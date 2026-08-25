import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import type { ApiOfflineError, HttpApiError } from "@/api/gateway/errors"
import { readCustody, storeCustody } from "./custody"
import { createPresentedCredentialProvider } from "./provider"
import { resolveBoot } from "./boot"

function gatewayOf(
  run: (request: GatewayRequest) => Promise<unknown>
): Gateway {
  return {
    request: run as unknown as Gateway["request"],
  }
}

const offline: ApiOfflineError = { kind: "offline" }
const refused: HttpApiError = { kind: "unauthenticated", status: 401 }

function providerOver(gateway: Gateway) {
  return createPresentedCredentialProvider({ gateway })
}

describe("session boot decision matrix", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("resolves authenticated when Platform accepts the stored credential", async () => {
    storeCustody("credential-1")

    await expect(
      resolveBoot(
        providerOver(gatewayOf(() => Promise.resolve({ capabilities: [] })))
      )
    ).resolves.toEqual({ status: "authenticated" })
  })

  it("resolves unauthenticated for a refused credential and discards the dead custody", async () => {
    storeCustody("credential-stale")

    await expect(
      resolveBoot(providerOver(gatewayOf(() => Promise.reject(refused))))
    ).resolves.toEqual({ status: "unauthenticated" })
    expect(readCustody()).toBeNull()
  })

  it("resolves unauthenticated with no stored custody and never touches the wire", async () => {
    const request = vi.fn(() => Promise.resolve({ capabilities: [] }))

    await expect(
      resolveBoot(providerOver(gatewayOf(request)))
    ).resolves.toEqual({ status: "unauthenticated" })
    expect(request).not.toHaveBeenCalled()
  })

  it("resolves unreachable when Platform cannot be asked", async () => {
    storeCustody("credential-1")

    await expect(
      resolveBoot(providerOver(gatewayOf(() => Promise.reject(offline))))
    ).resolves.toEqual({ status: "unreachable" })
  })
})
