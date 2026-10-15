import { useState, type FormEvent, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import type { NotesConnection } from "@/features/notes/notes-source"
import { describeSitesFailure } from "./sites-source"
import {
  DEFAULT_FRONTMATTER,
  type PublicationSettings,
} from "./publications-source"
import {
  draftOf,
  settingsOf,
  type Draft,
  type ListKey,
} from "./publication-draft"

function Choice({
  legend,
  children,
}: {
  readonly legend: string
  readonly children: ReactNode
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-body font-medium">{legend}</legend>
      {children}
    </fieldset>
  )
}

/** The editor of one publication of a site. */
// eslint-disable-next-line max-lines-per-function -- one form owns its fields and its save.
export function PublicationEditor({
  publicationId,
  settings,
  vaults,
  onSave,
}: {
  readonly publicationId: string
  readonly settings: PublicationSettings
  readonly vaults: readonly NotesConnection[]
  readonly onSave: (settings: PublicationSettings) => Promise<void>
}) {
  const [draft, setDraft] = useState(() => draftOf(settings))
  const [pending, setPending] = useState(false)
  const [outcome, setOutcome] = useState<string | null>(null)
  const id = (field: string) => `publication-${publicationId}-${field}`
  const set = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }))
  const list = (key: ListKey, label: string) => (
    <div className="flex flex-col gap-2">
      <label className="text-body font-medium" htmlFor={id(key)}>
        {label}
      </label>
      <textarea
        aria-describedby={id("lines")}
        className="min-h-20 rounded-lg border border-border bg-background p-3 font-mono text-body"
        id={id(key)}
        onChange={(event) => set({ [key]: event.target.value })}
        value={draft[key]}
      />
    </div>
  )
  const radio = <K extends "mode" | "release_mode">(
    key: K,
    { value, label }: { value: Draft[K]; label: string }
  ) => (
    <label className="flex items-center gap-2 text-body">
      <input
        checked={draft[key] === value}
        name={id(key)}
        onChange={() => set({ [key]: value })}
        type="radio"
      />
      {label}
    </label>
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (draft.connection_id === "") {
      setOutcome("Select a vault connection.")
      return
    }
    setPending(true)
    try {
      await onSave(settingsOf(draft))
      setOutcome("The publication is saved.")
    } catch (failure) {
      setOutcome(
        describeSitesFailure(failure, "The publication was not saved.")
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      aria-labelledby={id("heading")}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-subtle"
      onSubmit={(event) => void submit(event)}
    >
      <h3 className="text-subheading font-semibold" id={id("heading")}>
        Publication {publicationId}
      </h3>
      <div className="flex flex-col gap-2">
        <label className="text-body font-medium" htmlFor={id("vault")}>
          Vault connection
        </label>
        <select
          className="h-9 rounded-lg border border-border bg-background px-3 text-body"
          id={id("vault")}
          onChange={(event) => set({ connection_id: event.target.value })}
          required={true}
          value={draft.connection_id}
        >
          <option value="">Select a vault</option>
          {vaults.map((vault) => (
            <option key={vault.connection_id} value={vault.connection_id}>
              {vault.vault_display_name}
            </option>
          ))}
        </select>
      </div>
      <p className="text-caption text-muted-foreground" id={id("lines")}>
        Write one entry on each line.
      </p>
      {list("included_folders", "Included folders")}
      {list("excluded_folders", "Excluded folders")}
      {list("included_tags", "Included tags")}
      <Choice legend="Mode">
        {radio("mode", {
          value: "flagged",
          label: "Only flagged files: publish: true, or an included tag",
        })}
        {radio("mode", {
          value: "all",
          label:
            "All Markdown files, in the included folders when you name some",
        })}
      </Choice>
      <Choice legend="Release mode">
        {radio("release_mode", {
          value: "automatic",
          label: "Automatic: build after a selected file changes",
        })}
        {radio("release_mode", {
          value: "manual",
          label: "Manual: build only when you request it",
        })}
      </Choice>
      <div className="flex flex-col gap-1">
        <p className="text-body font-medium">
          Frontmatter fields that are always published
        </p>
        <ul className="flex flex-wrap gap-2">
          {DEFAULT_FRONTMATTER.map((name) => (
            <li
              className="rounded-md bg-muted px-2 font-mono text-body"
              key={name}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
      {list("frontmatter_allow", "More frontmatter fields")}
      <Button className="self-start" disabled={pending} type="submit">
        {pending ? "Saving the publication…" : "Save the publication"}
      </Button>
      <p aria-live="polite" className="text-body" role="status">
        {outcome}
      </p>
    </form>
  )
}
