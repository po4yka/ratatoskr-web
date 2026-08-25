import { useState, type FormEvent } from "react"
import { Navigate, useLocation } from "react-router"
import { useAuth } from "@/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FormStatus = "idle" | "submitting" | "refused" | "unreachable"

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
 * they landed. The form is deliberately functional and nothing more — the
 * presented-credential mode asks for a Platform bearer the user already
 * holds; username/password arrives when Platform grows that endpoint. After
 * a successful sign-in the user returns to the URL they originally asked for.
 */
export default function LoginPage() {
  const { state, signIn } = useAuth()
  const location = useLocation()
  const intended = intendedFrom(location)

  const [status, setStatus] = useState<FormStatus>("idle")

  if (state.status === "authenticated") {
    return <Navigate to={intended} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const credential = new FormData(event.currentTarget).get("credential")
    if (typeof credential !== "string" || credential.length === 0) {
      return
    }

    setStatus("submitting")
    const outcome = await signIn(credential)
    if (outcome.status === "signed-in") return
    setStatus(outcome.status)
  }

  const submitting = status === "submitting"

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 p-6">
      <h1 className="text-heading-sm font-semibold">Sign in to Ratatoskr</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="credential">Platform credential</Label>
          <Input
            id="credential"
            name="credential"
            type="password"
            autoComplete="off"
            required
            disabled={submitting}
          />
          <p className="text-caption text-muted-foreground">
            Paste an existing Platform session credential. It is checked with
            Platform before this client keeps it.
          </p>
        </div>

        {status === "refused" && (
          <p role="alert" className="text-body text-destructive">
            That credential was not accepted. Nothing was kept; check it and
            try again.
          </p>
        )}
        {status === "unreachable" && (
          <p role="alert" className="text-body text-destructive">
            Ratatoskr could not be reached, so the credential was not judged.
            Check the deployment and try again.
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
        {status === "unreachable" && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStatus("idle")}
          >
            Try again
          </Button>
        )}
      </form>
    </main>
  )
}
