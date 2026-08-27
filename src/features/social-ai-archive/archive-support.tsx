import { Button } from "@/components/ui/button"

export function FixtureIntegrationNotice({
  surface,
}: {
  readonly surface: string
}) {
  return (
    <p
      className="rounded-xl border border-border bg-muted p-4 text-body text-muted-foreground"
      role="status"
    >
      {surface} is using contract-fixed fixtures. Live Edge integration is
      pending its published contract.
    </p>
  )
}

export function ArchiveState({
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
