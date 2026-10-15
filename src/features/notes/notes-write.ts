import type { Gateway } from "@/api/gateway/client"
import { sha256Hex } from "./digest"
import { describeNotesFailure } from "./notes-source"

/*
 * The write shapes of workspace change add-notes-write-back. The pinned Edge
 * contract has no notes route yet, so this module holds them, as
 * notes-source.ts holds the read shapes:
 * - the shared chunked upload on `/v1/notes/connections/{id}/blobs`
 *   (ratatoskr-notes, services/notes/src/api/blobs.rs);
 * - the three Edge routes that answer 202 with an operation
 *   (ratatoskr-platform, crates/public-api/src/notes_writes.rs);
 * - the conflict view (ratatoskr-notes, services/notes/src/api/conflicts.rs).
 */

/** Content-addressed bytes that ratatoskr-notes holds. */
export interface BlobRef {
  readonly digest: { readonly algorithm: "sha256"; readonly hex: string }
  readonly length_bytes: number
  readonly media_type: string
  readonly owner_service: string
}

/** One operation of `notes/write-request.v1` that this client sends. */
export interface UpdateOperation {
  readonly update: {
    readonly path: string
    readonly base_hash: string
    readonly blob: BlobRef
  }
}

export type ResolutionChoice =
  "keep_current" | "keep_writer" | "accept_merge" | "custom"

export type ConflictSide = "base" | "current" | "writer" | "merged"

/** `GET /v1/notes/conflicts/{conflict_id}`. */
export interface NotesConflict {
  readonly conflict_id: string
  readonly connection_id: string
  readonly path: string
  readonly media_type: string
  /** `open` or `resolved`. */
  readonly state: string
  readonly merge_proposal?: {
    readonly merged_hash: string
    readonly has_overlapping_hunks: boolean
  }
  /** The text of each side of a text file, when notes could read it. */
  readonly texts?: Readonly<Partial<Record<ConflictSide, string>>>
  /** The sides over the 1 MiB cap, whose text is not in `texts`. */
  readonly texts_over_limit?: readonly ConflictSide[]
}

/** The 202 answer of the three Edge routes: an operation to follow. */
export interface WriteAccepted {
  readonly operation_id: string
  readonly status: string
}

interface UploadOpened {
  readonly resumption_token: string
  readonly chunk_size_bytes: number
}

type UploadOutcome =
  | { readonly outcome: "stored"; readonly blob_ref: BlobRef }
  | { readonly outcome: string }

/** The media types whose text notes merges and shows. */
export const TEXT_MEDIA_TYPES: readonly string[] = [
  "text/markdown",
  "text/plain",
]

/** The chunk size that this client asks for: 1 MiB. */
const CHUNK_BYTES = 1024 * 1024

/** The media type of the content of a note at `path`. */
export function mediaTypeOf(path: string): string {
  return path.toLowerCase().endsWith(".md") ? "text/markdown" : "text/plain"
}

/** A new key for one write, one resolution or one write-mode change. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}

function connection(connectionId: string): string {
  return `/v1/notes/connections/${encodeURIComponent(connectionId)}`
}

function accepted(answer: WriteAccepted | undefined): WriteAccepted {
  if (answer === undefined) throw new Error("The write answer was empty.")
  return answer
}

/** The upload content of one write. */
export interface Content {
  readonly connectionId: string
  readonly bytes: Uint8Array<ArrayBuffer>
  readonly mediaType: string
}

/** The write calls, all through the one gateway. */
export function notesWrites(gateway: Gateway) {
  async function upload(content: Content): Promise<BlobRef> {
    const blobs = `${connection(content.connectionId)}/blobs`
    const opened = await gateway.request<UploadOpened>({
      path: blobs,
      method: "POST",
      body: {
        declared_size_bytes: content.bytes.length,
        media_type: content.mediaType,
        digest: { algorithm: "sha256", hex: await sha256Hex(content.bytes) },
        chunk_size_bytes: CHUNK_BYTES,
      },
    })
    if (opened === undefined) throw new Error("The upload did not open.")
    const token = encodeURIComponent(opened.resumption_token)
    const size = opened.chunk_size_bytes
    for (let index = 0; index * size < content.bytes.length; index += 1)
      await gateway.request({
        path: `${blobs}/${token}/chunks/${index}`,
        method: "PUT",
        bytes: content.bytes.subarray(index * size, (index + 1) * size),
      })
    const outcome = await gateway.request<UploadOutcome>({
      path: `${blobs}/${token}/finalize`,
      method: "POST",
      body: { resumption_token: opened.resumption_token },
    })
    if (outcome === undefined || !("blob_ref" in outcome))
      throw { code: "notes.upload.not_stored" }
    return outcome.blob_ref
  }

  return {
    upload,
    async update(input: {
      readonly connectionId: string
      readonly operation: UpdateOperation
      readonly key: string
    }): Promise<WriteAccepted> {
      return accepted(
        await gateway.request<WriteAccepted>({
          path: `${connection(input.connectionId)}/writes`,
          method: "POST",
          headers: { "Idempotency-Key": input.key },
          body: { operation: input.operation },
        })
      )
    },
    async setWriteMode(input: {
      readonly connectionId: string
      readonly mode: "on" | "off"
      readonly key: string
    }): Promise<WriteAccepted> {
      return accepted(
        await gateway.request<WriteAccepted>({
          path: `${connection(input.connectionId)}/write-mode`,
          method: "PUT",
          headers: { "Idempotency-Key": input.key },
          body: { write_mode: input.mode },
        })
      )
    },
    async conflict(conflictId: string): Promise<NotesConflict> {
      const answer = await gateway.request<NotesConflict>({
        path: `/v1/notes/conflicts/${encodeURIComponent(conflictId)}`,
      })
      if (answer === undefined) throw new Error("The conflict was empty.")
      return answer
    },
    async resolve(input: {
      readonly conflict: NotesConflict
      readonly choice: ResolutionChoice
      readonly blob?: BlobRef
      readonly key: string
    }): Promise<WriteAccepted> {
      const id = encodeURIComponent(input.conflict.conflict_id)
      return accepted(
        await gateway.request<WriteAccepted>({
          path: `/v1/notes/conflicts/${id}/resolution`,
          method: "POST",
          headers: { "Idempotency-Key": input.key },
          body: {
            connection_id: input.conflict.connection_id,
            choice: input.choice,
            ...(input.blob === undefined ? {} : { blob: input.blob }),
          },
        })
      )
    },
  }
}

export type NotesWrites = ReturnType<typeof notesWrites>

const MESSAGES: Readonly<Record<string, string>> = {
  "notes.write.conflict":
    "The file changed in the vault after you opened it. Ratatoskr did not write your version.",
  "notes.write.disabled":
    "Write-back is off for this vault. Turn it on, then save again.",
  "notes.write.queue_full":
    "Too many changes wait for this vault. Try again later.",
  "notes.write.content_missing":
    "The server does not have the uploaded content. Save again.",
  "notes.write.partially_applied":
    "The vault took only a part of the change. Examine the files in Obsidian.",
  "notes.conflict.not_found":
    "The server does not know this conflict. It can be resolved already.",
  "notes.connection.not_found": "The server does not know this vault.",
  "notes.content.empty":
    "The content is empty. Type some text, or select another choice.",
  "notes.upload.not_stored":
    "The server did not keep the uploaded content. Save again.",
  "notes.request.invalid":
    "The server did not accept this change. Load the file again and try again.",
  "platform.request.idempotency_conflict":
    "The server already has another change with this key. Save again.",
}

/** One user-safe sentence for a failed write, resolution or upload. */
export function describeWriteFailure(failure: unknown, fallback: string) {
  if (typeof failure === "object" && failure !== null) {
    const { code } = failure as { code?: unknown }
    if (typeof code === "string" && code in MESSAGES) return MESSAGES[code]
  }
  return describeNotesFailure(failure, fallback)
}
