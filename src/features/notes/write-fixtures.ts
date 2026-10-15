import type { GatewayRequest } from "@/api/gateway/client"
import { browse } from "./browse-fixtures"

/*
 * The write routes as Edge and ratatoskr-notes answer them (workspace change
 * add-notes-write-back): the shared chunked upload on the blob route of the
 * connection (services/notes/src/api/blobs.rs), the three Edge routes that
 * answer 202 with an operation (crates/public-api/src/notes_writes.rs), and
 * the conflict view (services/notes/src/api/conflicts.rs).
 */

const CONNECTION = "/v1/notes/connections/connection-1"
const UPLOAD = `${CONNECTION}/blobs/upload-1`

/** The `BlobRef` that notes answers at finalize for the bytes of `hex`. */
export function storedBlob(hex: string, length: number) {
  return {
    digest: { algorithm: "sha256", hex },
    length_bytes: length,
    media_type: "text/markdown",
    owner_service: "ratatoskr-notes",
  }
}

interface Declared {
  readonly digest: { readonly hex: string }
  readonly declared_size_bytes: number
}

/** The declaration of the open upload, from the recorded calls. */
function declared(calls: readonly GatewayRequest[]): Declared {
  const open = calls.find(
    (call) => call.path === `${CONNECTION}/blobs` && call.method === "POST"
  )
  return open?.body as Declared
}

/** A snapshot of the operation that a write or a write-mode change minted. */
export function writeOperation(kind: string, status: string) {
  return {
    operation_id: "operation-7",
    kind,
    status,
    stage: null,
    progress_percent: null,
    status_changed_at: "2026-10-15T10:00:00Z",
    created_at: "2026-10-15T09:59:00Z",
    retryable: false,
    errors: [],
    warnings: [],
  }
}

/**
 * The read routes of `connection-1`, the upload, the write, the write-mode
 * switch, and the operation they mint. `calls` is the list that the render
 * records, so finalize answers the digest that the client declared.
 */
export function writes(calls: readonly GatewayRequest[]) {
  return (request: GatewayRequest): unknown => {
    switch (request.path) {
      case `${CONNECTION}/blobs`:
        return {
          resumption_token: "upload-1",
          chunk_size_bytes: 1024 * 1024,
          expires_at: "2026-10-15T11:00:00Z",
        }
      case `${UPLOAD}/chunks/0`:
        return {
          resumption_token: "upload-1",
          chunk_index: 0,
          idempotent_replay: false,
          received_chunks_count: 1,
        }
      case `${UPLOAD}/finalize`: {
        const open = declared(calls)
        return {
          outcome: "stored",
          blob_ref: storedBlob(open.digest.hex, open.declared_size_bytes),
        }
      }
      case `${CONNECTION}/writes`:
      case `${CONNECTION}/write-mode`:
        return { operation_id: "operation-7", status: "accepted" }
      case "/v1/operations/operation-7":
        return writeOperation("notes.file.write", "running")
      default:
        return browse(request)
    }
  }
}

const BASE = "# Plan\nShip the reader first.\n"
const CURRENT = "# Plan\nShip the reader first.\nThe vault added this line.\n"
const WRITER = "# Plan\nShip the editor first.\n"
const MERGED = "# Plan\nShip the editor first.\nThe vault added this line.\n"

/** An open conflict on a Markdown note, with or without a merge proposal. */
export function conflict(id: string, proposal: boolean) {
  return {
    conflict_id: id,
    operation_id: "operation-7",
    connection_id: "connection-1",
    path: "Projects/Plan.md",
    origin: "platform",
    media_type: "text/markdown",
    state: "open",
    base_hash: "a1".repeat(32),
    current_hash: "c2".repeat(32),
    writer_hash: "e3".repeat(32),
    ...(proposal
      ? {
          merge_proposal: {
            merged_hash: "d4".repeat(32),
            has_overlapping_hunks: false,
          },
          texts: {
            base: BASE,
            current: CURRENT,
            writer: WRITER,
            merged: MERGED,
          },
        }
      : { texts: { base: BASE, current: CURRENT, writer: WRITER } }),
    texts_over_limit: [],
  }
}

/**
 * A conflict whose current and writer sides are over the 1 MiB cap: notes
 * leaves their text out, names them in `texts_over_limit`, and makes no merge.
 */
export function largeConflict(id: string) {
  return {
    ...conflict(id, false),
    texts: { base: BASE },
    texts_over_limit: ["current", "writer"],
  }
}

/**
 * The conflict routes: `conflict-1` has a proposal, `conflict-2` has none,
 * `conflict-3` has sides too large to show.
 */
export function conflicts(request: GatewayRequest): unknown {
  switch (request.path) {
    case "/v1/notes/conflicts/conflict-1":
      return conflict("conflict-1", true)
    case "/v1/notes/conflicts/conflict-2":
      return conflict("conflict-2", false)
    case "/v1/notes/conflicts/conflict-3":
      return largeConflict("conflict-3")
    default:
      return undefined
  }
}
