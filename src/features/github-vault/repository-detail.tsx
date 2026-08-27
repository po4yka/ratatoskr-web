import { useState } from "react"
import { Link } from "react-router"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { FixtureIntegrationNotice } from "@/features/github-vault/fixture-integration-notice"
import type {
  CatalogCommand,
  GitHubRepository,
} from "@/features/github-vault/github-vault-source"

export function RepositoryDetail({
  onMutate,
  repository,
}: {
  readonly onMutate: (command: CatalogCommand) => Promise<void>
  readonly repository: GitHubRepository
}) {
  const [error, setError] = useState<string | null>(null)

  async function confirm(command: CatalogCommand) {
    try {
      await onMutate(command)
      setError(null)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Catalog state could not be changed."
      )
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <Link
        className="text-body text-muted-foreground hover:underline"
        to="/github"
      >
        Back to GitHub catalog
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-sm font-semibold">{repository.fullName}</h1>
        <p className="text-body text-muted-foreground">
          {repository.description}
        </p>
      </header>
      <FixtureIntegrationNotice surface="GitHub catalog" />
      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <h2 className="text-subheading font-semibold">Catalog metadata</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Fact label="State" value={repository.state} />
          <Fact label="Language" value={repository.language} />
          <Fact label="Stars" value={String(repository.stars)} />
          <Fact label="Forks" value={String(repository.forks)} />
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <RepositoryAction
            command={starCommand(repository)}
            onConfirm={confirm}
            repository={repository}
          />
          <RepositoryAction
            command={trackCommand(repository)}
            onConfirm={confirm}
            repository={repository}
          />
        </div>
      </section>
      {error ? (
        <p className="text-body text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Analysis repository={repository} />
    </section>
  )
}

function Fact({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div>
      <dt className="text-caption font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-body">{value}</dd>
    </div>
  )
}

function Analysis({ repository }: { readonly repository: GitHubRepository }) {
  if (!repository.analysis)
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <h2 className="text-subheading font-semibold">Analysis</h2>
        <p className="mt-2 text-body text-muted-foreground">
          No analysis was supplied for this repository.
        </p>
      </section>
    )
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <h2 className="text-subheading font-semibold">Analysis</h2>
      <p className="mt-2 text-body">{repository.analysis.summary}</p>
      <p className="mt-3 text-caption text-muted-foreground">
        Revision {repository.analysis.revisionDigest} · analyzed{" "}
        {repository.analysis.analyzedAt}
      </p>
    </section>
  )
}

function RepositoryAction({
  command,
  onConfirm,
  repository,
}: {
  readonly command: CatalogCommand
  readonly onConfirm: (command: CatalogCommand) => Promise<void>
  readonly repository: GitHubRepository
}) {
  const action =
    command.kind === "set-starred"
      ? command.value
        ? "Star"
        : "Unstar"
      : command.value
        ? "Track"
        : "Untrack"
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>
        {action} {repository.fullName}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action} {repository.fullName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action} changes the catalog state for {repository.fullName}. This
            fixture action is not a live provider write.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep current state</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm(command)}>
            {action} {repository.fullName}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function starCommand(repository: GitHubRepository): CatalogCommand {
  return {
    kind: "set-starred",
    repositoryId: repository.id,
    value: repository.state !== "starred",
  }
}
function trackCommand(repository: GitHubRepository): CatalogCommand {
  return {
    kind: "set-tracked",
    repositoryId: repository.id,
    value: repository.state !== "tracked",
  }
}
