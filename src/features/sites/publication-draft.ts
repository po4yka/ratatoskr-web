import type { PublicationSettings } from "./publications-source"

/** The text of a list field: one entry per line. */
export type Draft = Omit<
  PublicationSettings,
  | "included_folders"
  | "excluded_folders"
  | "included_tags"
  | "frontmatter_allow"
> &
  Record<
    | "included_folders"
    | "excluded_folders"
    | "included_tags"
    | "frontmatter_allow",
    string
  >

export type ListKey = Exclude<
  keyof Draft,
  "connection_id" | "mode" | "release_mode"
>

export function draftOf(settings: PublicationSettings): Draft {
  return {
    ...settings,
    included_folders: settings.included_folders.join("\n"),
    excluded_folders: settings.excluded_folders.join("\n"),
    included_tags: settings.included_tags.join("\n"),
    frontmatter_allow: settings.frontmatter_allow.join("\n"),
  }
}

function lines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function settingsOf(draft: Draft): PublicationSettings {
  return {
    connection_id: draft.connection_id,
    mode: draft.mode,
    release_mode: draft.release_mode,
    included_folders: lines(draft.included_folders),
    excluded_folders: lines(draft.excluded_folders),
    included_tags: lines(draft.included_tags),
    frontmatter_allow: lines(draft.frontmatter_allow),
  }
}
