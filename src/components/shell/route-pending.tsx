/**
 * The designed state for a route region whose view code has not arrived yet.
 * It is a status region so the wait is announced, and it lives inside the
 * shell — the navigation never disappears behind a slow chunk.
 */
export function RoutePending() {
  return (
    <div
      role="status"
      className="flex items-center gap-3 p-6 text-body text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className="size-2 animate-pulse rounded-full bg-muted-foreground"
      />
      Loading this page…
    </div>
  )
}
