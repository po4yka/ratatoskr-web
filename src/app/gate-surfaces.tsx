import { Navigate, useLocation } from "react-router"
import { Button } from "@/components/ui/button"

/**
 * Where a signed-out visitor goes instead of a protected route: `/login`,
 * carrying the URL they asked for, so sign-in can return them there.
 */
export function RedirectToLogin() {
  const location = useLocation()
  const from = `${location.pathname}${location.search}${location.hash}`
  return <Navigate to="/login" replace state={{ from }} />
}

/**
 * The catch-all inside the shell: an address nothing routes to, rendered
 * truthfully rather than as somebody else's page.
 */
export function RouteNotFound() {
  return (
    <section>
      <h1 className="text-heading-sm font-semibold">Nothing lives here</h1>
      <p className="text-body text-muted-foreground">
        The address does not match a page in this client.
      </p>
    </section>
  )
}

/**
 * A gated route whose capability the deployment does not offer. This is an
 * explained absence, not an error: the session is fine, the address is right,
 * and this deployment simply does not run what the page needs. Deliberately
 * not the not-found surface, which answers a different question.
 */
export function CapabilityUnavailable() {
  return (
    <section>
      <h1 className="text-heading-sm font-semibold">
        Not available in this deployment
      </h1>
      <p className="text-body text-muted-foreground">
        Your deployment does not include what this page needs, so it is not
        offered here. Nothing is wrong with your session; if this deployment
        should have it, check its configuration.
      </p>
    </section>
  )
}

/**
 * A gated route while availability cannot be decided: discovery failed, so
 * the client refuses to claim the deployment either has or lacks anything.
 * Retry re-reads and the route opens or stays shut per the fresh answer.
 */
export function CapabilityUndecidable({ onRetry }: { onRetry: () => void }) {
  return (
    <section>
      <h1 className="text-heading-sm font-semibold">
        Availability is unknown right now
      </h1>
      <p className="text-body text-muted-foreground">
        The client could not ask your deployment what it offers, so it cannot
        tell whether this page is available. Nothing has been decided; try again
        once the deployment is reachable.
      </p>
      <div>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </section>
  )
}
