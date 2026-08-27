import { useEffect, useState } from "react"
import { useParams } from "react-router"
import {
  fixtureSocialAiArchiveSource,
  type AiProvider,
  type ArchiveContentPart,
  type ArchiveConversation,
  type SocialAiArchiveSnapshot,
  type SocialAiArchiveSource,
} from "@/features/social-ai-archive/archive-source"
import {
  ArchiveState,
  FixtureIntegrationNotice,
} from "@/features/social-ai-archive/archive-support"
import { backupStatusLabel } from "@/features/social-ai-archive/backup-status"

// eslint-disable-next-line complexity -- Route-state selection keeps each reader's absence explicit.
export default function AiArchivePage({
  source = fixtureSocialAiArchiveSource,
}: {
  readonly source?: SocialAiArchiveSource
}) {
  const { error, snapshot, retry } = useArchive(source)
  const { itemId, provider, view } = useParams()
  if (!snapshot)
    return (
      <ArchiveState
        action={error ? retry : undefined}
        title={error ?? "Loading AI archive"}
      />
    )
  if (!isAiProvider(provider))
    return <ArchiveState title="AI archive not found" />
  const conversation = snapshot.conversations.find(
    (item) => item.provider === provider && item.id === itemId
  )
  if (view === "conversations")
    return conversation ? (
      <ConversationReader conversation={conversation} />
    ) : (
      <ArchiveState title="Conversation not found" />
    )
  const artifact = snapshot.artifacts.find(
    (item) => item.provider === provider && item.id === itemId
  )
  if (view === "artifacts")
    return artifact ? (
      <ArtifactReader artifact={artifact} />
    ) : (
      <ArchiveState title="Artifact not found" />
    )
  return <ArchiveList provider={provider} snapshot={snapshot} />
}

function ArchiveList({
  provider,
  snapshot,
}: {
  readonly provider: AiProvider
  readonly snapshot: SocialAiArchiveSnapshot
}) {
  const imports = snapshot.imports.filter((item) => item.provider === provider)
  const projects = snapshot.projects.filter(
    (item) => item.provider === provider
  )
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <h1 className="text-heading-sm font-semibold">{provider} archive</h1>
      </header>
      <FixtureIntegrationNotice surface={`${provider} archive`} />
      <ul className="flex flex-col gap-3" role="list">
        {!imports.length ? <li>No imports are available.</li> : null}
        {imports.map((item) => (
          <li
            className="rounded-xl border border-border bg-card p-5 shadow-subtle"
            key={item.id}
          >
            <p className="text-body font-medium">
              {item.outcome === "partial"
                ? "Partial import"
                : "Imported archive"}
            </p>
            <p className="mt-1 text-body text-muted-foreground">
              {item.completeness.status === "complete"
                ? "Archive complete"
                : `Completeness gaps: ${item.completeness.gaps.join(", ")}`}
            </p>
          </li>
        ))}
      </ul>
      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <h2 className="text-subheading font-semibold">Projects</h2>
        <ul className="mt-3 flex flex-col gap-2" role="list">
          {!projects.length ? <li>No projects are available.</li> : null}
          {projects.map((project) => (
            <li key={project.id}>{project.title}</li>
          ))}
        </ul>
      </section>
    </section>
  )
}

function ConversationReader({
  conversation,
}: {
  readonly conversation: ArchiveConversation
}) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <header>
        <h1 className="text-heading-sm font-semibold">{conversation.title}</h1>
      </header>
      <FixtureIntegrationNotice
        surface={`${conversation.provider} conversation`}
      />
      <ol className="flex flex-col gap-3">
        {conversation.messages.map((message) => (
          <li
            className="rounded-xl border border-border bg-card p-5 shadow-subtle"
            key={message.id}
          >
            <p className="text-caption font-medium">{message.role}</p>
            {message.contentParts.map((part, index) => (
              <ContentPart key={`${message.id}-${index}`} part={part} />
            ))}
          </li>
        ))}
      </ol>
    </section>
  )
}

function ArtifactReader({
  artifact,
}: {
  readonly artifact: SocialAiArchiveSnapshot["artifacts"][number]
}) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <header>
        <h1 className="text-heading-sm font-semibold">{artifact.title}</h1>
      </header>
      <FixtureIntegrationNotice surface="Claude artifact" />
      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <p className="text-body">
          {backupStatusLabel(artifact.evidence, artifact.status)}
        </p>
        <h2 className="mt-4 text-subheading font-semibold">Versions</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {artifact.versions.map((version) => (
            <li key={version.id}>
              {version.label} · {version.createdAt}
            </li>
          ))}
        </ol>
      </section>
    </section>
  )
}

function ContentPart({ part }: { readonly part: ArchiveContentPart }) {
  if (part.kind === "code")
    return (
      <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-body">
        <code>{part.text}</code>
      </pre>
    )
  if (part.kind === "attachment")
    return <p className="mt-3 text-body">Attachment: {part.label}</p>
  return <p className="mt-3 text-body-lg">{part.text}</p>
}

function isAiProvider(value: string | undefined): value is AiProvider {
  return value === "chatgpt" || value === "claude"
}

function useArchive(source: SocialAiArchiveSource) {
  const [snapshot, setSnapshot] = useState<SocialAiArchiveSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    source.read().then(
      (value) => active && (setSnapshot(value), setError(null)),
      () => active && setError("AI archive could not be read.")
    )
    return () => {
      active = false
    }
  }, [attempt, source])
  return { error, snapshot, retry: () => setAttempt((value) => value + 1) }
}
