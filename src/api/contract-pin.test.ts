import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

// Under vitest's jsdom environment the global URL constructor resolves a
// relative path against location.href (http://localhost:3000/) even when an
// explicit file:// base is passed, so paths must be built with node:path.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")
const pinnedPath = join(repoRoot, "openapi/openapi.json")
const lockPath = join(repoRoot, "openapi/openapi.lock.json")

function collectKeys(node: unknown, keys: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) collectKeys(item, keys)
    return keys
  }
  if (node !== null && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      keys.push(key)
      collectKeys(value, keys)
    }
  }
  return keys
}

function collectStringValues(node: unknown, values: string[] = []): string[] {
  if (typeof node === "string") {
    values.push(node)
    return values
  }
  if (Array.isArray(node)) {
    for (const item of node) collectStringValues(item, values)
    return values
  }
  if (node !== null && typeof node === "object") {
    for (const value of Object.values(node)) collectStringValues(value, values)
  }
  return values
}

describe("contract pin lock file", () => {
  it("lock file matches the pinned document", async () => {
    const [pinned, raw] = await Promise.all([
      readFile(pinnedPath),
      readFile(lockPath, "utf8"),
    ])
    const digest = createHash("sha256").update(pinned).digest("hex")
    expect(JSON.parse(raw)).toMatchObject({ digest })
  })

  it("lock file carries provenance without volatile metadata", async () => {
    const raw = await readFile(lockPath, "utf8")
    const lock = JSON.parse(raw) as {
      platformCommit: string
      generator: { name: string; version: string }
    }
    expect(lock.platformCommit).toMatch(/^[0-9a-f]{40}$/)
    expect(lock.generator.name).toBe("openapi-typescript")
    expect(lock.generator.version).toMatch(/^\d+\./)

    const keys = collectKeys(lock)
    expect(keys.filter((key) => /(at|date|time)$/i.test(key))).toEqual([])

    const values = collectStringValues(lock)
    expect(
      values.filter((value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))
    ).toEqual([])
  })
})
