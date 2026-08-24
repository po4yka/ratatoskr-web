import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const generatorBin = join(
  repoRoot,
  "node_modules",
  ".bin",
  "openapi-typescript"
)
const pinnedContract = join(repoRoot, "openapi", "openapi.json")
const committedSchema = join(repoRoot, "src", "api", "generated", "schema.ts")

function generateInto(outputPath: string): void {
  // Same input/output arguments the api:gen script will use.
  execFileSync(generatorBin, [pinnedContract, "-o", outputPath], {
    cwd: repoRoot,
  })
}

describe("generated module", () => {
  it("repeated generation is byte-stable", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "ratatoskr-schema-"))
    try {
      const first = join(tempDir, "first.ts")
      const second = join(tempDir, "second.ts")
      generateInto(first)
      generateInto(second)
      const committed = readFileSync(committedSchema)
      expect(readFileSync(first).equals(committed)).toBe(true)
      expect(readFileSync(second).equals(committed)).toBe(true)
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it("generated module announces itself", () => {
    const head = readFileSync(committedSchema, "utf8")
      .split("\n")
      .slice(0, 5)
      .join("\n")
    expect(head).toMatch(/do not make direct changes/i)
    expect(head).toMatch(/openapi-typescript/i)
  })
})
