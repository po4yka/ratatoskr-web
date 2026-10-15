import type { Gateway } from "@/api/gateway/client"
import { sha256Hex } from "./digest"

/*
 * The /v1/notes wire shapes. The pinned Edge contract has no notes route yet,
 * so this module is the one place that holds them. They follow workspace
 * change add-notes-vault-connections, docs/NOTES_AND_SITES.md, and the
 * ConnectRequest that ratatoskr-notes reads. When Platform publishes the
 * routes, a regeneration commit replaces these types with generated ones.
 */

export interface NotesConnection {
  readonly connection_id: string
  readonly channel: string
  readonly vault_display_name: string
  /** `connecting`, `active` or `login_expired`. */
  readonly state: string
  /** The folders that are not indexed. */
  readonly excluded_folders: readonly string[]
  /** Status conditions, such as `notes.file.path_collision` with its paths. */
  readonly conditions: readonly {
    readonly code: string
    readonly paths: readonly string[]
  }[]
}

export interface SyncLogin {
  readonly email: string
  readonly password: string
  readonly mfa_code?: string
  readonly e2e_password?: string
}

export interface ConnectSync {
  readonly channel: "sync"
  readonly vault_key: string
  readonly vault_display_name: string
  readonly sync_login: SyncLogin
}

/**
 * The 202 answer of Edge: the operation that Edge minted, and the answer of
 * ratatoskr-notes unchanged under `connection`.
 */
export interface ConnectAccepted {
  readonly operation_id: string
  readonly status: string
  readonly connection: {
    readonly connection_id: string
    readonly channel: string
    readonly state: string
    readonly operation: {
      readonly operation_id: string
      readonly kind: string
      readonly lane: string
    }
  }
}

export interface NotesFile {
  readonly file_id: string
  readonly path: string
  /** The lowercase hex SHA-256 of the bytes. */
  readonly revision: string
  readonly media_type: string
  readonly length_bytes: number
}

/** The bytes of one revision as the client loaded them. */
export interface LoadedFile {
  /** The UTF-8 text, or `null` when the bytes are not UTF-8. */
  readonly text: string | null
  /** The lowercase hex SHA-256 of the loaded bytes. */
  readonly revision: string
}

/** The index of one Markdown note, as ratatoskr-notes builds it. */
export interface NoteIndex {
  readonly frontmatter: Readonly<Record<string, unknown>> | null
  readonly tags: readonly string[]
}

export interface FileIndex {
  readonly path: string
  readonly revision: string
  /** `null` for a file that is not a Markdown note. */
  readonly index: NoteIndex | null
  /** Each link, embed and frontmatter link, with the file it resolves to. */
  readonly links: readonly {
    readonly link: string
    readonly embed: boolean
    readonly target: string | null
  }[]
  readonly backlinks: readonly {
    readonly path: string
    readonly count: number
  }[]
}

const CONNECTIONS = "/v1/notes/connections"

/** The failure of a path that cannot name a file of a vault. */
const NOT_A_VAULT_PATH = {
  kind: "not-found",
  status: 404,
  code: "notes.file.not_found",
  message: "This path cannot name a file of the vault.",
} as const

/**
 * The encoded segments of a vault path. `encodeURIComponent` keeps `.` and
 * `..`, and fetch removes dot segments, so a path with an empty, `.` or `..`
 * segment, also with percent-encoded dots, could reach another route. It is
 * refused before any request.
 */
function segmentsOf(path: string): string {
  const segments = path.split("/")
  for (const segment of segments) {
    const dots = segment.replace(/%2e/gi, ".")
    if (segment === "" || dots === "." || dots === "..") throw NOT_A_VAULT_PATH
  }
  return segments.map(encodeURIComponent).join("/")
}

/** The routes match the file path with `{*path}`, so it goes as path segments. */
function filePath(connectionId: string, route: "files" | "index") {
  return (path: string) =>
    `${CONNECTIONS}/${encodeURIComponent(connectionId)}/${route}/${segmentsOf(path)}`
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("The notes answer was empty.")
  return value
}

/** The notes calls, all through the one gateway. */
export function notesSource(gateway: Gateway) {
  return {
    async connections(): Promise<readonly NotesConnection[]> {
      const page = await gateway.request<{ connections: NotesConnection[] }>({
        path: CONNECTIONS,
      })
      return required(page).connections
    },
    async connect(body: ConnectSync): Promise<ConnectAccepted> {
      const accepted = await gateway.request<ConnectAccepted>({
        path: CONNECTIONS,
        method: "POST",
        // No Idempotency-Key: Edge takes none here, because its ledger would
        // keep a digest of a body that holds the passwords.
        body,
      })
      return required(accepted)
    },
    async disconnect(connectionId: string): Promise<void> {
      await gateway.request({
        path: `${CONNECTIONS}/${encodeURIComponent(connectionId)}`,
        method: "DELETE",
      })
    },
    async files(connectionId: string): Promise<readonly NotesFile[]> {
      const page = await gateway.request<{ files: NotesFile[] }>({
        path: `${CONNECTIONS}/${encodeURIComponent(connectionId)}/files`,
      })
      return required(page).files
    },
    /**
     * The current revision: its text, `null` when it is not UTF-8, and the
     * SHA-256 of the loaded bytes, which a write names as its base.
     */
    async file(connectionId: string, path: string): Promise<LoadedFile> {
      if (gateway.stream === undefined)
        throw new Error("This gateway cannot read bytes.")
      const body = await gateway.stream({
        path: filePath(connectionId, "files")(path),
      })
      const bytes = new Uint8Array(await new Response(body).arrayBuffer())
      const revision = await sha256Hex(bytes)
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
        return { text, revision }
      } catch {
        return { text: null, revision }
      }
    },
    async index(connectionId: string, path: string): Promise<FileIndex> {
      const index = await gateway.request<FileIndex>({
        path: filePath(connectionId, "index")(path),
      })
      return required(index)
    },
  }
}

export type NotesSource = ReturnType<typeof notesSource>

const MESSAGES: Readonly<Record<string, string>> = {
  "notes.connection.vault_already_connected":
    "This vault is already connected. Disconnect it first to connect it again.",
  "notes.sync.login_failed":
    "Obsidian did not accept the email or the password.",
  "notes.sync.mfa_required":
    "Your Obsidian account uses MFA. Type the MFA code and try again.",
  "notes.sync.e2e_password_wrong":
    "The end-to-end encryption password is wrong.",
  "notes.sync.vault_not_found": "Obsidian Sync has no vault with this ID.",
  "notes.sync.login_expired":
    "The Obsidian login expired. Disconnect the vault and connect it again.",
  "notes.request.invalid":
    "The server did not accept the form. Examine the fields and try again.",
  "notes.file.not_found": "This file does not exist in the vault now.",
  "notes.conflict.not_found":
    "The server does not know this conflict. It can be resolved already.",
  "notes.connection.cleanup_failed":
    "The server could not remove the vault now. The vault is still connected. Try again later.",
  "notes.service.unavailable":
    "The notes service is not available now. Try again later.",
  "notes.sync.journal_unreadable":
    "The vault is connected, but the server cannot see when the Obsidian login expires.",
  "edge.upstream_unavailable":
    "The server could not reach the notes service. Try again later.",
  "edge.upstream_timeout":
    "The notes service did not answer in time. Try again later.",
  "edge.upstream_invalid_response":
    "The notes service gave an answer that the server cannot use. Try again later.",
  "platform.operation.stale":
    "The server stopped getting the progress of this connect. Disconnect the vault and connect it again.",
}

const KIND_MESSAGES: Readonly<Record<string, string>> = {
  offline: "You are offline. Connect to the network and try again.",
  unauthenticated: "Your session ended. Sign in again.",
  revoked: "Your session was revoked. Sign in again.",
  forbidden: "Your account cannot do this.",
  "not-found": "The server does not know this vault or file.",
}

/**
 * One user-safe sentence for a failure. It reads only the stable code and
 * the kind, never a request value, so a typed secret cannot reach it.
 */
export function describeNotesFailure(failure: unknown, fallback: string) {
  if (typeof failure !== "object" || failure === null) return fallback
  const { code, kind } = failure as { code?: unknown; kind?: unknown }
  if (typeof code === "string" && code in MESSAGES) return MESSAGES[code]
  if (typeof kind === "string" && kind in KIND_MESSAGES)
    return KIND_MESSAGES[kind]
  return fallback
}
