#!/usr/bin/env node
// Vendors an AIcss component into src/components/aicss/.
//
// AIcss is not a shadcn registry — it serves its own JSON shape from https://www.aicss.dev/r/<slug>,
// with no `.json` suffix and no registry-item schema — so `shadcn add` cannot reach it and this
// script is the install path. It writes the React flavour only; the Vue and Svelte files in the same
// payload are ignored.
//
//   npm run ui:add:aicss -- thinking-state
//
// Everything it writes is vendored source under the rules in src/components/ui/NOTICE.md: generated,
// never hand-edited, re-runnable. Read the component before using it. These arrive without
// reduced-motion handling and without live-region semantics, which is what src/components/aicss.tsx
// and the backstop in src/index.css exist to supply.

import { mkdir, writeFile } from "node:fs/promises"
import { argv, exit } from "node:process"

const REGISTRY = "https://www.aicss.dev/r"
const OUT_DIR = new URL("../src/components/aicss/", import.meta.url)

const slug = argv[2]
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error("usage: npm run ui:add:aicss -- <slug>   e.g. thinking-state")
  console.error("slugs are listed at https://www.aicss.dev/#components")
  exit(2)
}

const response = await fetch(`${REGISTRY}/${slug}`)
if (!response.ok) {
  // The registry answers 404 with a JSON body naming the slug it could not find, which is more
  // useful to print than the status alone.
  console.error(`${REGISTRY}/${slug} -> ${response.status}`)
  console.error(await response.text())
  exit(1)
}

const item = await response.json()
const files = (item.files ?? []).filter((file) => file.language === "react")

if (files.length === 0) {
  console.error(`${slug} ships no React files. Payload had: ${(item.files ?? []).map((f) => f.language).join(", ") || "nothing"}`)
  exit(1)
}

await mkdir(OUT_DIR, { recursive: true })

for (const file of files) {
  if (!file.filename || file.filename.includes("/")) {
    console.error(`refusing to write ${JSON.stringify(file.filename)}: expected a bare filename`)
    exit(1)
  }
  const target = new URL(file.filename, OUT_DIR)
  await writeFile(target, file.code.endsWith("\n") ? file.code : `${file.code}\n`)
  console.log(`  wrote src/components/aicss/${file.filename}`)
}

console.log(`\n${item.name} (${item.tier}) by ${item.contributor?.name ?? "unknown"} — ${item.page}`)
console.log("Run `npm run format` and read the component before using it.")
