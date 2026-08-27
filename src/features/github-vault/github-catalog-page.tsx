import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { FixtureIntegrationNotice } from "@/features/github-vault/fixture-integration-notice"
import {
  fixtureGitHubVaultSource,
  type CatalogCommand,
  type GitHubVaultSnapshot,
  type GitHubVaultSource,
} from "@/features/github-vault/github-vault-source"
import {
  CatalogPending,
  CatalogState,
  ConnectionCard,
  RepositoryList,
} from "@/features/github-vault/github-catalog-support"
import { RepositoryDetail } from "@/features/github-vault/repository-detail"

interface CatalogData {
  readonly error: string | null
  readonly reload: () => void
  readonly snapshot: GitHubVaultSnapshot | null
}

export default function GitHubCatalogPage({
  source = fixtureGitHubVaultSource,
}: {
  readonly source?: GitHubVaultSource
}) {
  const catalog = useCatalog(source)
  const { repositoryId } = useParams()

  if (catalog.snapshot === null)
    return <CatalogPending error={catalog.error} onRetry={catalog.reload} />

  const repository = catalog.snapshot.repositories.find(
    (item) => item.id === repositoryId
  )
  if (repositoryId && repository) {
    return (
      <RepositoryDetail
        onMutate={mutate(source, catalog.reload)}
        repository={repository}
      />
    )
  }
  if (repositoryId) return <CatalogState title="Repository not found" />

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-sm font-semibold">GitHub catalog</h1>
        <p className="text-body text-muted-foreground">
          Repository metadata and states supplied by the catalog source.
        </p>
      </header>
      <FixtureIntegrationNotice surface="GitHub catalog" />
      <ConnectionCard
        onConnect={source.connectPat}
        snapshot={catalog.snapshot}
      />
      <RepositoryList repositories={catalog.snapshot.repositories} />
    </section>
  )
}

function useCatalog(source: GitHubVaultSource): CatalogData {
  const [snapshot, setSnapshot] = useState<GitHubVaultSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    source.read().then(
      (value) => {
        if (active) {
          setSnapshot(value)
          setError(null)
        }
      },
      (reason: unknown) => {
        if (active) setError(messageFor(reason))
      }
    )
    return () => {
      active = false
    }
  }, [attempt, source])

  return { snapshot, error, reload: () => setAttempt((value) => value + 1) }
}

function mutate(source: GitHubVaultSource, reload: () => void) {
  return async (command: CatalogCommand) => {
    await source.mutate(command)
    reload()
  }
}

function messageFor(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : "GitHub catalog could not be read."
}
