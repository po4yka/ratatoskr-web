export function FixtureIntegrationNotice() {
  return (
    <aside className="rounded-xl border border-border bg-muted p-5 text-body text-muted-foreground">
      <strong className="font-medium text-foreground">
        Integration pending.
      </strong>{" "}
      Collections and tags use deterministic fixtures until the server publishes
      their contract and capability gates. Changes here are not saved to your
      archive.
    </aside>
  )
}
