import type { Gateway } from "@/api/gateway/client"

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
  /** For example `connecting`, `active`, `failed` or `login_expired`. */
  readonly state: string
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

export interface ConnectAccepted {
  readonly operation_id?: string
  readonly connection_id: string
  readonly state: string
}

export interface NotesFile {
  readonly path: string
  readonly revision: string
}

export interface FilePage {
  readonly files: readonly NotesFile[]
  readonly next_cursor?: string | null
}

export interface FileText {
  readonly path: string
  readonly revision: string
  readonly content: string
}

export interface FileIndex {
  readonly path: string
  readonly backlinks: readonly { readonly path: string }[]
}

const CONNECTIONS = "/v1/notes/connections"

function filePath(connectionId: string, route: "files" | "index") {
  return (path: string) =>
    `${CONNECTIONS}/${encodeURIComponent(connectionId)}/${route}/${encodeURIComponent(path)}`
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
        body,
        headers: { "Idempotency-Key": crypto.randomUUID() },
      })
      return required(accepted)
    },
    async disconnect(connectionId: string): Promise<void> {
      await gateway.request({
        path: `${CONNECTIONS}/${encodeURIComponent(connectionId)}`,
        method: "DELETE",
      })
    },
    async files(connectionId: string, cursor?: string): Promise<FilePage> {
      const page = await gateway.request<FilePage>({
        path: `${CONNECTIONS}/${encodeURIComponent(connectionId)}/files`,
        ...(cursor === undefined ? {} : { query: { cursor } }),
      })
      return required(page)
    },
    async file(connectionId: string, path: string): Promise<FileText> {
      const text = await gateway.request<FileText>({
        path: filePath(connectionId, "files")(path),
      })
      return required(text)
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
  "notes.service.unavailable":
    "The notes service is not available now. Try again later.",
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
