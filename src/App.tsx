import { RouterProvider } from "react-router/dom"
import { useMemo } from "react"
import { createAppRouter, type RouteModules } from "@/app/router"
import { AuthProvider, useAuth } from "@/auth/auth-context"
import type { SessionWiring } from "@/auth/session-gateway"
import { wireSessions } from "@/auth/session-gateway"
import { Button } from "@/components/ui/button"

/**
 * Where the API answers. Same-origin by default: the deployment fronts the
 * Edge API with the client until a deployment splits them, and then this is
 * the one place the base URL changes.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

export interface AppProps {
  /**
   * The session composition. Production builds one over real fetch; tests
   * inject doubles so no test ever reaches a network.
   */
  wiring?: SessionWiring
  /** Route-module overrides; a test seam production never uses. */
  routeModules?: RouteModules
}

/**
 * The application root. Boot resolves before any route mounts, so no view
 * flashes: pending renders a designed state, an unreachable deployment
 * renders a boot failure with retry, and everything else hands the tree to
 * the router, which gates routes by the session.
 */
export function App({ wiring, routeModules }: AppProps) {
  const session = useMemo(
    () => wiring ?? wireSessions({ baseUrl: API_BASE_URL }),
    [wiring]
  )

  return (
    <AuthProvider wiring={session}>
      <AppSession routeModules={routeModules} />
    </AuthProvider>
  )
}

function AppSession({ routeModules }: { routeModules?: RouteModules }) {
  const { state, retryBoot } = useAuth()

  const router = useMemo(
    () => createAppRouter(state.status === "authenticated", routeModules),
    [state.status, routeModules]
  )

  if (state.status === "booting") {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p role="status" className="text-body text-muted-foreground">
          Checking your session…
        </p>
      </main>
    )
  }

  if (state.status === "unreachable") {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-heading-sm font-semibold">
          Ratatoskr could not reach your deployment.
        </h1>
        <p className="text-body text-muted-foreground">
          Platform did not answer when the client asked whether a session is
          standing. Nothing has been decided about your sign-in; check that the
          deployment is running and try again.
        </p>
        <div>
          <Button variant="outline" onClick={retryBoot}>
            Retry
          </Button>
        </div>
      </main>
    )
  }

  return <RouterProvider router={router} />
}

export default App
