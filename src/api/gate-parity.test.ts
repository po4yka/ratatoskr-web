import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, it } from "vitest"

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

// Mirrors the awk guard inside .github/workflows/ci.yml: the inline
// `- run: npm …` steps, in order. Steps written as `run:` under a `name:` key
// are invisible to the guard, so they are invisible here too.
function workflowSteps(): string[] {
  return readFileSync(join(root, ".github", "workflows", "ci.yml"), "utf8")
    .split("\n")
    .filter((line) => /^\s+- run: npm /.test(line))
    .map((line) => line.replace(/^\s+- run: /, ""))
}

// The fenced command list under "### The gate": the document side of the same
// guard. Collection stops at the closing fence, like the awk does.
function guideSteps(): string[] {
  const lines = readFileSync(join(root, "DEVELOPMENT.md"), "utf8").split("\n")
  const steps: string[] = []
  let inside = false
  for (const line of lines) {
    if (!inside && /^### The gate/.test(line)) {
      inside = true
      continue
    }
    if (!inside) continue
    if (/^```$/.test(line)) break
    if (/^npm /.test(line)) steps.push(line)
  }
  return steps
}

it("workflow and guide list the same verification step", () => {
  const inWorkflow = workflowSteps()
  const inGuide = guideSteps()

  expect(
    inWorkflow,
    ".github/workflows/ci.yml gate job lists the drift check"
  ).toContain("npm run api:check")
  expect(inGuide, "DEVELOPMENT.md gate block lists the drift check").toContain(
    "npm run api:check"
  )
  expect(inGuide.indexOf("npm run api:check")).toBe(
    inWorkflow.indexOf("npm run api:check")
  )
})
