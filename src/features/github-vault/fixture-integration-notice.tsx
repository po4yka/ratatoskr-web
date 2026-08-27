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
