import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import {
  fixtureSocialAiArchiveSource,
  type Acquisition,
  type SocialAiArchiveSnapshot,
  type SocialAiArchiveSource,
  type SocialPost,
  type SocialProvider,
} from "@/features/social-ai-archive/archive-source"
import {
  ArchiveState,
  FixtureIntegrationNotice,
} from "@/features/social-ai-archive/archive-support"

const provenanceLabel: Record<Acquisition, string> = {
  bookmark_snapshot: "Bookmark snapshot",
  explicit_capture: "Explicit capture",
  import: "Import",
}

export default function SocialPostsPage({
  source = fixtureSocialAiArchiveSource,
}: {
  readonly source?: SocialAiArchiveSource
}) {
  const { error, snapshot, retry } = useSnapshot(source)
  const { postId, provider } = useParams()
  if (!snapshot)
    return (
      <ArchiveState
        action={error ? retry : undefined}
        title={error ?? "Loading social posts"}
      />
    )
  if (!isSocialProvider(provider))
    return <ArchiveState title="Social provider not found" />
  const post = snapshot.posts.find(
    (item) => item.provider === provider && item.id === postId
  )
  if (postId)
    return post ? (
      <PostDetail post={post} />
    ) : (
      <ArchiveState title="Post not found" />
    )
  return <PostList provider={provider} snapshot={snapshot} />
}

function PostList({
  provider,
  snapshot,
}: {
  readonly provider: SocialProvider
  readonly snapshot: SocialAiArchiveSnapshot
}) {
  const [folderId, setFolderId] = useState("")
  const folders = snapshot.folders.filter(
    (folder) => folder.provider === provider
  )
  const posts = snapshot.posts.filter(
    (post) =>
      post.provider === provider && (!folderId || post.folderId === folderId)
  )
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-sm font-semibold">{provider} posts</h1>
        <p className="text-body text-muted-foreground">
          Posts and acquisition evidence supplied by the archive source.
        </p>
      </header>
      <FixtureIntegrationNotice surface={`${provider} posts`} />
      {folders.length ? (
        <label
          className="flex max-w-xs flex-col gap-1.5 text-body"
          htmlFor="social-folder"
        >
          Folder
          <select
            className="rounded-lg border border-border bg-background px-3 py-2"
            id="social-folder"
            onChange={(event) => setFolderId(event.target.value)}
            value={folderId}
          >
            <option value="">All posts</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {posts.length ? (
        <Posts posts={posts} />
      ) : (
        <ArchiveState title="No posts match this folder" />
      )}
    </section>
  )
}

function Posts({ posts }: { readonly posts: readonly SocialPost[] }) {
  return (
    <ul className="flex flex-col gap-3" role="list">
      {posts.map((post) => (
        <li
          className="rounded-xl border border-border bg-card p-5 shadow-subtle"
          key={post.id}
        >
          <p className="text-caption font-medium">
            {provenanceLabel[post.provenance]}
          </p>
          <Link
            className="mt-2 block text-body font-medium hover:underline"
            to={`/social/${post.provider}/${post.id}`}
          >
            {post.author}
          </Link>
          <p className="mt-1 text-body text-muted-foreground">{post.text}</p>
        </li>
      ))}
    </ul>
  )
}

function PostDetail({ post }: { readonly post: SocialPost }) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <header>
        <h1 className="text-heading-sm font-semibold">{post.author}</h1>
      </header>
      <FixtureIntegrationNotice surface={`${post.provider} post`} />
      <article className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <p className="text-caption font-medium">
          {provenanceLabel[post.provenance]}
        </p>
        <p className="mt-3 text-body-lg">{post.text}</p>
        {post.documentId ? (
          <Link
            className="mt-4 inline-block text-body font-medium hover:underline"
            to={`/documents/${post.documentId}`}
          >
            Open extracted article
          </Link>
        ) : null}
      </article>
    </section>
  )
}

function isSocialProvider(value: string | undefined): value is SocialProvider {
  return value === "x" || value === "instagram" || value === "threads"
}

function useSnapshot(source: SocialAiArchiveSource) {
  const [snapshot, setSnapshot] = useState<SocialAiArchiveSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    source.read().then(
      (value) => active && (setSnapshot(value), setError(null)),
      () => active && setError("Social posts could not be read.")
    )
    return () => {
      active = false
    }
  }, [attempt, source])
  return { error, snapshot, retry: () => setAttempt((value) => value + 1) }
}
