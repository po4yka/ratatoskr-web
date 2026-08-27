import { describe, expect, it } from "vitest"
import {
  createFixtureGitHubVaultSource,
  fixtureGitHubVaultSnapshot,
} from "@/features/github-vault/github-vault-source"

describe("GitHub and vault fixture source", () => {
  it("keeps fixture GitHub and vault projections integration-pending", async () => {
    const snapshot = await createFixtureGitHubVaultSource().read()

    expect(snapshot.integration).toBe("fixture")
    expect(snapshot.repositories).toHaveLength(3)
    expect(snapshot.mirrors).toHaveLength(2)
  })

  it("preserves supplied mirror snapshots and drill facts", () => {
    const [passing, failing] = fixtureGitHubVaultSnapshot.mirrors

    expect(passing.snapshots[0]?.manifestDigest).toBe("sha256:5d11b3b68dfe9a80")
    expect(passing.restoreDrill?.outcome).toBe("passed")
    expect(failing.restoreDrill).toMatchObject({
      outcome: "failed",
      durationMs: 9000,
    })
  })
})
