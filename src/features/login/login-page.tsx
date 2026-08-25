import { Navigate, useLocation } from "react-router"
import { useAuth } from "@/auth/auth-context"

function intendedFrom(location: ReturnType<typeof useLocation>): string {
  const state: unknown = location.state
  if (
    typeof state === "object" &&
    state !== null &&
    "from" in state &&
    typeof state.from === "string" &&
    state.from.startsWith("/")
  ) {
    return state.from
  }
  return "/"
}

/**
 * The unauthorized surface: what an unauthenticated visitor sees, wherever
 * they landed. It names the state and carries the sign-in entry; after a
 * successful sign-in the user returns to the URL they originally asked for.
 */
export default function LoginPage() {
  const { state } = useAuth()
  const location = useLocation()
  const intended = intendedFrom(location)

  if (state.status === "authenticated") {
    return <Navigate to={intended} replace />
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-heading-sm font-semibold">Sign in to Ratatoskr</h1>
    </main>
  )
}
