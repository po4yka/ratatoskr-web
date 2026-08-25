import { spawnSync } from "node:child_process"
import { appendFileSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const pinnedContract = join(repoRoot, "openapi", "openapi.json")

function gitStatus(): string {
  return (
    spawnSync("git", ["status", "--porcelain"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).stdout ?? ""
  )
}

function runApiCheck(): { status: number | null; output: string } {
  const result = spawnSync("npm", ["run", "api:check"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` }
}

describe("drift verification", () => {
  // Each test spawns `npm run api:check` as a subprocess; under full-suite
  // parallel load that exceeds the default budget, so they carry their own.
  it(
    "verification passes when output matches",
    { timeout: 30_000 },
    () => {
      const treeBefore = gitStatus()
      const { status } = runApiCheck()
      expect(status).toBe(0)
      expect(gitStatus()).toBe(treeBefore)
    }
  )

  it(
    "verification fails on drift",
    { timeout: 30_000 },
    () => {
      const original = readFileSync(pinnedContract)
      // Snapshot taken before mutating and compared after restoring: while the
      // drifted bytes sit in place the tree is intentionally dirty, so the
      // invariant under test is that api:check itself never touches tracked files.
      const treeBefore = gitStatus()
      try {
        appendFileSync(pinnedContract, "\n")
        const { status, output } = runApiCheck()
        expect(status).not.toBe(0)
        expect(output).toMatch(/openapi\.json/)
        expect(output).toMatch(/openapi\.lock\.json/)
      } finally {
        writeFileSync(pinnedContract, original)
      }
      expect(gitStatus()).toBe(treeBefore)
    }
  )
})
