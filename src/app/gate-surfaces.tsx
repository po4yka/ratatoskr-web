import { Navigate, useLocation } from "react-router"

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
