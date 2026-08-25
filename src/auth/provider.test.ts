import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import type { ApiOfflineError, HttpApiError } from "@/api/gateway/errors"
import {
  createPresentedCredentialProvider,
  type AuthProvider,
} from "./provider"
import { readCustody, storeCustody } from "./custody"

/** A Gateway double whose request function returns whatever the test needs. */
function gatewayOf(
  run: (request: GatewayRequest) => Promise<unknown>
): Gateway {
  return {
    request: run as unknown as Gateway["request"],
  }
}

const offline: ApiOfflineError = { kind: "offline" }
const refused: HttpApiError = { kind: "unauthenticated", status: 401 }

describe("presented-credential auth provider", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("probes the stored credential and maps success to authenticated", async () => {
    storeCustody("credential-1")
    const provider = createPresentedCredentialProvider({
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
    })

    await expect(provider.probe()).resolves.toBe("authenticated")
  })

  it("maps a refused or revoked answer to unauthenticated", async () => {
    for (const failure of [refused, { kind: "revoked" }]) {
      storeCustody("credential-stale")
      const provider = createPresentedCredentialProvider({
        gateway: gatewayOf(() => Promise.reject(failure)),
      })

      await expect(provider.probe()).resolves.toBe("unauthenticated")
    }
  })

  it("holds no session when custody is empty, without spending a wire call", async () => {
    const request = vi.fn(() => Promise.resolve({ capabilities: [] }))
    const provider = createPresentedCredentialProvider({
      gateway: gatewayOf(request),
    })

    await expect(provider.probe()).resolves.toBe("unauthenticated")
    expect(request).not.toHaveBeenCalled()
  })

  it("maps an unreachable backend to an unreachable probe outcome", async () => {
    storeCustody("credential-1")
    const provider = createPresentedCredentialProvider({
      gateway: gatewayOf(() => Promise.reject(offline)),
    })

    await expect(provider.probe()).resolves.toBe("unreachable")
  })

  it("signs in with a credential the probe accepts, taking custody only then", async () => {
    const presentedDuringRequest: Array<string | null> = []
    const provider = createPresentedCredentialProvider({
      gateway: gatewayOf(() => {
        presentedDuringRequest.push(provider.tokenSource.current())
        return Promise.resolve({ capabilities: [] })
      }),
    })

    await expect(provider.signIn("candidate-1")).resolves.toEqual({
      status: "signed-in",
    })
    expect(presentedDuringRequest).toEqual(["candidate-1"])
    expect(readCustody()).toBe("candidate-1")
  })

  it("refuses sign-in of an unusable credential without taking custody", async () => {
    const provider = createPresentedCredentialProvider({
      gateway: gatewayOf(() => Promise.reject(refused)),
    })

    await expect(provider.signIn("garbage")).resolves.toEqual({
      status: "refused",
    })
    expect(readCustody()).toBeNull()
  })

  it("reports an unreachable backend during sign-in as its own outcome", async () => {
    const provider = createPresentedCredentialProvider({
      gateway: gatewayOf(() => Promise.reject(offline)),
    })

    await expect(provider.signIn("credential-1")).resolves.toEqual({
      status: "unreachable",
    })
    expect(readCustody()).toBeNull()
  })

  it("keeps a refused candidate out of storage so a later sign-in presents only itself", async () => {
    const presentedDuringRequest: Array<string | null> = []
    let refuse = true
    const provider = createPresentedCredentialProvider({
      gateway: gatewayOf(() => {
        presentedDuringRequest.push(provider.tokenSource.current())
        if (refuse) return Promise.reject(refused)
        return Promise.resolve({ capabilities: [] })
      }),
    })

    await provider.signIn("first-try")
    expect(readCustody()).toBeNull()

    refuse = false
    await provider.signIn("second-try")
    expect(presentedDuringRequest).toEqual(["first-try", "second-try"])
  })

  it("revokes by discarding custody", async () => {
    storeCustody("credential-1")
    const provider: AuthProvider = createPresentedCredentialProvider({
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
    })

    await provider.revoke()
    expect(readCustody()).toBeNull()
  })

  it("reports refresh as rejected: this contract version has no refresh mechanism", async () => {
    const provider = createPresentedCredentialProvider({
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
    })

    await expect(provider.refresh()).resolves.toEqual({ status: "rejected" })
  })
})
