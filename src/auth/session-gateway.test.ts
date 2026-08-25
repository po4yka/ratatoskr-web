import { beforeEach, describe, expect, it, vi } from "vitest"
import { baseDeps, envelope, jsonResponse } from "@/api/gateway/gateway-fixtures"
import { readCustody, storeCustody } from "./custody"
import { wireSessions } from "./session-gateway"

describe("session gateway wiring", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("ends the whole session when a mid-use refusal cannot be refreshed", async () => {
    storeCustody("expired-credential")
    const onSessionRevoked = vi.fn()
    const script = baseDeps(() => Promise.resolve(jsonResponse(401, envelope())))
    const { gateway, provider } = wireSessions({ ...script, onSessionRevoked })

    // Any feature call through the wired gateway hits an expired credential.
    await expect(gateway.request({ path: "/v1/capabilities" })).rejects.toEqual({
      kind: "revoked",
    })

    // The refusal resolved through the provider's refresh answer to
    // "rejected", which is a confirmed revocation in this contract version:
    // custody is gone and the callback ran exactly once.
    expect(onSessionRevoked).toHaveBeenCalledTimes(1)
    expect(readCustody()).toBeNull()

    // The provider is the same instance features sign in with.
    await expect(provider.signIn("fresh-credential")).resolves.toEqual({
      status: "refused",
    })
  })
})
