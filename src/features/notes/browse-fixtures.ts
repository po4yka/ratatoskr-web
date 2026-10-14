import type { GatewayRequest } from "@/api/gateway/client"

/*
 * The read routes of ratatoskr-notes as the notes handlers answer them
 * (services/notes/src/api/read.rs). A file path is sent as path segments,
 * because the routes match it with `{*path}`.
 */

export const connections = {
  connections: [
    {
      connection_id: "connection-1",
      channel: "sync",
      vault_display_name: "Research",
      state: "active",
      excluded_folders: [],
      conditions: [],
    },
    {
      connection_id: "connection-2",
      channel: "plugin",
      vault_display_name: "Journal",
      state: "login_expired",
      excluded_folders: ["Private"],
      conditions: [],
    },
  ],
}

const FILES = "/v1/notes/connections/connection-1/files"
const INDEX = "/v1/notes/connections/connection-1/index"

const files = {
  files: [
    {
      file_id: "file-1",
      path: "Projects/Plan.md",
      revision: "aa".repeat(32),
      media_type: "text/markdown",
      length_bytes: 30,
    },
    {
      file_id: "file-2",
      path: "Inbox.md",
      revision: "bb".repeat(32),
      media_type: "text/markdown",
      length_bytes: 12,
    },
  ],
}

/** The index of `Projects/Plan.md`: its links, tags, properties, backlinks. */
const planIndex = {
  path: "Projects/Plan.md",
  revision: "aa".repeat(32),
  index: {
    frontmatter: { status: "draft" },
    tags: ["#plan"],
    headings: [{ level: 1, heading: "Plan" }],
    blocks: [],
    aliases: [],
    links: [],
    embeds: [],
    frontmatter_links: [],
  },
  links: [
    { link: "Inbox", embed: false, target: "Inbox.md" },
    { link: "Missing note", embed: false, target: null },
  ],
  backlinks: [{ path: "Inbox.md", count: 2 }],
}

/** The JSON routes of one vault, `connection-1`. */
export function browse(request: GatewayRequest): unknown {
  switch (request.path) {
    case "/v1/notes/connections":
      return connections
    case FILES:
      return files
    case `${INDEX}/Projects/Plan.md`:
      return planIndex
    default:
      return undefined
  }
}

/** The bytes of the file routes of `connection-1`. */
export function fileBytes(request: GatewayRequest): Uint8Array {
  if (request.path === `${FILES}/Projects/Plan.md`)
    return new TextEncoder().encode("# Plan\nShip the reader first.")
  throw {
    kind: "not-found",
    status: 404,
    code: "notes.file.not_found",
    message: "The file does not exist at this revision.",
  }
}
