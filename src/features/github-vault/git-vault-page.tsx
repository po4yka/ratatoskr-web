import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { FixtureIntegrationNotice } from "@/features/github-vault/fixture-integration-notice"
import {
  fixtureGitHubVaultSource,
  type GitHubVaultSnapshot,
  type GitHubVaultSource,
  type VaultMirror,
} from "@/features/github-vault/github-vault-source"
import { MirrorDetail } from "@/features/github-vault/vault-mirror-detail"

export default function GitVaultPage({
  source = fixtureGitHubVaultSource,
}: {
  readonly source?: GitHubVaultSource
}) {
  const { snapshot, error, retry } = useVault(source)
  const { mirrorId } = useParams()

  if (!snapshot)
    return (
      <VaultState
        action={error ? retry : undefined}
        title={error ?? "Loading Git Vault"}
      />
    )
  return <VaultContents mirrorId={mirrorId} mirrors={snapshot.mirrors} />
}

function VaultContents({
  mirrorId,
  mirrors,
}: {
  readonly mirrorId?: string
  readonly mirrors: readonly VaultMirror[]
}) {
  if (mirrorId)
    return <MirrorRoute mirror={mirrors.find((item) => item.id === mirrorId)} />
  if (!mirrors.length) return <VaultState title="No mirrors are available" />

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-sm font-semibold">Git Vault</h1>
        <p className="text-body text-muted-foreground">
          Mirror health, snapshots, and restore-drill evidence supplied by the
          vault.
        </p>
      </header>
      <FixtureIntegrationNotice surface="Git Vault" />
      <MirrorList mirrors={mirrors} />
    </section>
  )
}

function MirrorRoute({ mirror }: { readonly mirror?: VaultMirror }) {
  return mirror ? (
    <MirrorDetail mirror={mirror} />
  ) : (
    <VaultState title="Mirror not found" />
  )
}

function useVault(source: GitHubVaultSource) {
  const [snapshot, setSnapshot] = useState<GitHubVaultSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    source.read().then(
      (value) => active && (setSnapshot(value), setError(null)),
      (reason: unknown) => active && setError(messageFor(reason))
    )
    return () => {
      active = false
    }
  }, [attempt, source])

  return { snapshot, error, retry: () => setAttempt((value) => value + 1) }
}

function MirrorList({ mirrors }: { readonly mirrors: readonly VaultMirror[] }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <h2 className="text-subheading font-semibold">Mirrors</h2>
      <ul className="mt-4 flex flex-col gap-4" role="list">
        {mirrors.map((mirror) => (
          <li
            className="flex flex-wrap items-baseline justify-between gap-3"
            key={mirror.id}
          >
            <div>
              <Link
                className="text-body font-medium hover:underline"
                to={`/vault/${mirror.id}`}
              >
                {mirror.repositoryName}
              </Link>
              <p className="text-caption text-muted-foreground">
                Last mirrored {mirror.lastMirroredAt}
              </p>
            </div>
            <p className="text-body">Health: {mirror.health}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function VaultState({
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
function messageFor(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "Git Vault could not be read."
}
