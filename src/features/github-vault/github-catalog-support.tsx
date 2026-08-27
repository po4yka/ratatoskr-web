import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type {
  GitHubRepository,
  GitHubVaultSnapshot,
} from "@/features/github-vault/github-vault-source"
import { cn } from "@/lib/utils"

export function ConnectionCard({
  onConnect,
  snapshot,
}: {
  readonly onConnect: (token: string) => Promise<unknown>
  readonly snapshot: GitHubVaultSnapshot
}) {
  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token.trim()) return setError("A personal access token is required.")
    try {
      setPending(true)
      await onConnect(token)
      setError(null)
      setStatus("GitHub connection submitted.")
    } catch (reason) {
      setError(describeFailure(reason))
    } finally {
      setPending(false)
      setToken("")
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <h2 className="text-subheading font-semibold">Connect GitHub</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Use a personal access token only for this connection request. It is not
        kept in the browser.
      </p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => void submit(event)}
      >
        <label className="flex flex-col gap-1.5" htmlFor="github-pat">
          <span className="text-caption font-medium">
            Personal access token
          </span>
          <Input
            autoComplete="new-password"
            id="github-pat"
            onChange={(event) => setToken(event.target.value)}
            onInvalid={(event) => {
              event.preventDefault()
              setError("A personal access token is required.")
            }}
            required={true}
            type="password"
            value={token}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <Button disabled={pending} type="submit">
            {pending ? "Connecting GitHub…" : "Connect with token"}
          </Button>
          {snapshot.authorizationUrl ? (
            <a
              className={cn(buttonVariants({ variant: "outline" }))}
              href={snapshot.authorizationUrl}
            >
              Connect GitHub with OAuth
            </a>
          ) : null}
        </div>
      </form>
      {snapshot.connected ? (
        <p aria-live="polite" className="mt-3 text-body" role="status">
          GitHub is connected in this fixture.
        </p>
      ) : null}
      {status ? (
        <p aria-live="polite" className="mt-3 text-body" role="status">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-body text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}

export function RepositoryList({
  repositories,
}: {
  readonly repositories: readonly GitHubRepository[]
}) {
  if (!repositories.length)
    return <CatalogState title="No repositories in this catalog" />
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <h2 className="text-subheading font-semibold">Repositories</h2>
      <ul className="mt-4 flex flex-col gap-3" role="list">
        {repositories.map((repository) => (
          <li
            className="flex flex-wrap items-baseline justify-between gap-3"
            key={repository.id}
          >
            <div>
              <Link
                className="text-body font-medium hover:underline"
                to={`/github/${repository.id}`}
              >
                {repository.fullName}
              </Link>
              <p className="text-body text-muted-foreground">
                {repository.description}
              </p>
            </div>
            <p className="text-caption text-muted-foreground">
              {repository.state} · {repository.language} · {repository.stars}{" "}
              stars
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CatalogPending({
  error,
  onRetry,
}: {
  readonly error: string | null
  readonly onRetry: () => void
}) {
  if (error) return <CatalogState action={onRetry} title={error} />
  return <CatalogState title="Loading GitHub catalog" />
}

export function CatalogState({
  action,
  title,
}: {
  readonly action?: () => void
  readonly title: string
}) {
  return (
    <main className="mx-auto flex min-h-56 max-w-5xl flex-col justify-center gap-4 p-6">
      <h1 className="text-heading-sm font-semibold">{title}</h1>
      {action ? (
        <Button onClick={action} variant="outline">
          Retry
        </Button>
      ) : null}
    </main>
  )
}

function describeFailure(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "GitHub catalog could not be read."
}
