import type { ReactNode } from "react"
import { Link } from "react-router"
import { fileLink, type Read } from "./notes-read"
import type { FileIndex } from "./notes-source"

export function Failure({ message }: { readonly message: string }) {
  return (
    <p className="text-body text-destructive" role="alert">
      {message}
    </p>
  )
}

/**
 * One section of the index of a file: a heading that names the region, the
 * loading and failed states of the index read, and `empty` when `items` is
 * empty.
 */
function IndexSection<T>({
  id,
  title,
  index,
  items,
  empty,
  children,
}: {
  readonly id: string
  readonly title: string
  readonly index: Read<FileIndex>
  readonly items: (index: FileIndex) => readonly T[]
  readonly empty: string
  readonly children: (item: T) => ReactNode
}) {
  const list = index.kind === "ready" ? items(index.value) : []
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h3 className="text-subheading font-semibold" id={id}>
        {title}
      </h3>
      {index.kind === "loading" ? (
        <p role="status">Loading the {title.toLowerCase()}</p>
      ) : null}
      {index.kind === "failed" ? <Failure message={index.message} /> : null}
      {index.kind === "ready" && list.length === 0 ? (
        <p className="text-body text-muted-foreground">{empty}</p>
      ) : null}
      {list.length > 0 ? (
        <ul className="flex flex-col gap-1">{list.map(children)}</ul>
      ) : null}
    </section>
  )
}

function FileLink({ path }: { readonly path: string }) {
  return (
    <Link className="text-body hover:underline" to={fileLink(path)}>
      {path}
    </Link>
  )
}

/** A frontmatter value as one line of text. */
function valueText(value: unknown): string {
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.map(valueText).join(", ")
  return JSON.stringify(value)
}

/** The links, tags, properties and backlinks of one file, from its index. */
export function IndexSections({ index }: { readonly index: Read<FileIndex> }) {
  return (
    <>
      <IndexSection
        empty="This file links to no file."
        id="notes-links"
        index={index}
        items={(value) => value.links}
        title="Links"
      >
        {(link) => (
          <li className="text-body" key={`${link.link}-${String(link.embed)}`}>
            {link.target === null ? (
              `${link.link} (not in the vault)`
            ) : (
              <FileLink path={link.target} />
            )}
            {link.embed ? " (embedded)" : null}
          </li>
        )}
      </IndexSection>
      <IndexSection
        empty="This file has no tags."
        id="notes-tags"
        index={index}
        items={(value) => value.index?.tags ?? []}
        title="Tags"
      >
        {(tag) => (
          <li className="text-body" key={tag}>
            {tag}
          </li>
        )}
      </IndexSection>
      <IndexSection
        empty="This file has no properties."
        id="notes-properties"
        index={index}
        items={(value) => Object.entries(value.index?.frontmatter ?? {})}
        title="Properties"
      >
        {([key, value]) => (
          <li className="text-body" key={key}>
            <span className="font-medium">{key}</span>: {valueText(value)}
          </li>
        )}
      </IndexSection>
      <IndexSection
        empty="No file links to this file."
        id="notes-backlinks"
        index={index}
        items={(value) => value.backlinks}
        title="Backlinks"
      >
        {(backlink) => (
          <li key={backlink.path}>
            <FileLink path={backlink.path} />
          </li>
        )}
      </IndexSection>
    </>
  )
}
