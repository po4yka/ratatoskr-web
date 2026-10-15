import type { Gateway } from "@/api/gateway/client"
import {
  notesSource,
  type NotesConnection,
} from "@/features/notes/notes-source"

/*
 * The publication shapes of workspace change add-site-publications. Edge at
 * Platform 3a47f0f forwards GET, PUT and DELETE of
 * /v1/sites/{site}/publications/{publication} to ratatoskr-sites as
 * management routes, and the sites service does not serve them yet. The
 * field names are the columns of `sites.publications` in the sites schema.
 */

/** What the owner chooses for one publication: the body of the save. */
export interface PublicationSettings {
  readonly connection_id: string
  /** `all` selects every Markdown file; `flagged` only the flagged ones. */
  readonly mode: "all" | "flagged"
  /** `automatic` builds after a selected change; `manual` only on request. */
  readonly release_mode: "automatic" | "manual"
  readonly included_folders: readonly string[]
  readonly excluded_folders: readonly string[]
  readonly included_tags: readonly string[]
  /** The frontmatter fields that a page carries beyond the default allowlist. */
  readonly frontmatter_allow: readonly string[]
}

/** One stored publication of a site. */
export interface Publication extends PublicationSettings {
  readonly publication_id: string
  /** `active`, or `suspended` after its vault was disconnected. */
  readonly state?: string
}

/**
 * The frontmatter fields that every page carries when the note has them
 * (workspace spec `site-release-privacy`).
 */
export const DEFAULT_FRONTMATTER: readonly string[] = [
  "title",
  "description",
  "tags",
  "aliases",
  "date",
  "updated",
  "cover",
]

/** The settings of a publication that the site does not store yet. */
export const NEW_PUBLICATION: PublicationSettings = {
  connection_id: "",
  mode: "flagged",
  release_mode: "automatic",
  included_folders: [],
  excluded_folders: [],
  included_tags: [],
  frontmatter_allow: [],
}

function publications(siteId: string): string {
  return `/v1/sites/${encodeURIComponent(siteId)}/publications`
}

/** The publication calls, and the vault connections they can select from. */
export function publicationsSource(gateway: Gateway) {
  const notes = notesSource(gateway)
  return {
    async publications(siteId: string): Promise<readonly Publication[]> {
      const list = await gateway.request<{ publications: Publication[] }>({
        path: publications(siteId),
      })
      return list?.publications ?? []
    },
    async save(input: {
      readonly siteId: string
      readonly publicationId: string
      readonly settings: PublicationSettings
    }): Promise<void> {
      await gateway.request({
        path: `${publications(input.siteId)}/${encodeURIComponent(input.publicationId)}`,
        method: "PUT",
        body: input.settings,
      })
    },
    vaults(): Promise<readonly NotesConnection[]> {
      return notes.connections()
    },
  }
}

export type PublicationsSource = ReturnType<typeof publicationsSource>
