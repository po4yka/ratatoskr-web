import { Link } from "react-router"
import { FixtureIntegrationNotice } from "@/features/github-vault/fixture-integration-notice"
import type {
  RestoreDrill,
  VaultMirror,
} from "@/features/github-vault/github-vault-source"

export function MirrorDetail({ mirror }: { readonly mirror: VaultMirror }) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <Link
        className="text-body text-muted-foreground hover:underline"
        to="/vault"
      >
        Back to Git Vault
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-sm font-semibold">
          {mirror.repositoryName}
        </h1>
        <p className="text-body text-muted-foreground">
          Mirror health: {mirror.health}
        </p>
      </header>
      <FixtureIntegrationNotice surface="Git Vault" />
      <SnapshotList snapshots={mirror.snapshots} />
      <DrillEvidence drill={mirror.restoreDrill} />
    </section>
  )
}

function SnapshotList({
  snapshots,
}: {
  readonly snapshots: VaultMirror["snapshots"]
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <h2 className="text-subheading font-semibold">Snapshots</h2>
      {snapshots.length ? (
        <ul className="mt-4 flex flex-col gap-3" role="list">
          {snapshots.map((snapshot) => (
            <li key={snapshot.id}>
              <p className="text-body font-medium">{snapshot.id}</p>
              <p className="text-caption text-muted-foreground">
                Created {snapshot.createdAt}
              </p>
              <code className="mt-1 block text-caption break-all">
                Manifest {snapshot.manifestDigest}
              </code>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-body text-muted-foreground">
          No snapshots were supplied.
        </p>
      )}
    </section>
  )
}

function DrillEvidence({ drill }: { readonly drill?: RestoreDrill }) {
  if (!drill)
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <h2 className="text-subheading font-semibold">
          Restore drill evidence
        </h2>
        <p className="mt-2 text-body text-muted-foreground">
          No restore-drill evidence was supplied.
        </p>
      </section>
    )
  const verified = drill.outcome === "passed"
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <h2 className="text-subheading font-semibold">Restore drill evidence</h2>
      <p className="mt-2 text-body">Outcome: {drill.outcome}</p>
      <p className="text-body">
        {verified
          ? "Restore verified by this passing drill."
          : "Restore was not verified: the supplied drill failed."}
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <Fact label="Started" value={drill.startedAt} />
        <Fact label="Completed" value={drill.completedAt} />
        <Fact label="Duration" value={`${drill.durationMs} ms`} />
      </dl>
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
