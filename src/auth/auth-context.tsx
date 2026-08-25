import * as React from "react"
import { resolveBoot } from "./boot"
import type { SignInOutcome } from "./provider"
import type { SessionWiring } from "./session-gateway"

/**
 * Where the application stands while and after boot resolves. The four
 * states map one to one onto designed surfaces: a pending state, the
 * protected shell, the unauthorized surface, and a boot failure with retry.
 */
export type AuthState =
  | { status: "booting" }
  | { status: "authenticated" }
  | { status: "unauthenticated" }
  | { status: "unreachable" }

export interface AuthContextValue {
  state: AuthState
  signIn(credential: string): Promise<SignInOutcome>
  signOut(): Promise<void>
  retryBoot(): void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
)

export interface AuthProviderProps {
  wiring: SessionWiring
  children: React.ReactNode
}

/**
 * Own the session lifecycle for the React tree: run the boot resolver once,
 * expose sign-in and sign-out as awaited actions that move the state, and
 * let a failed boot be retried.
 */
export function AuthProvider({ wiring, children }: AuthProviderProps) {
  const [state, setState] = React.useState<AuthState>({ status: "booting" })

  const runBoot = React.useCallback(() => {
    setState({ status: "booting" })
    resolveBoot(wiring.provider).then(
      (outcome) => {
        setState({ status: outcome.status })
      },
      () => {
        // resolveBoot maps provider failures already; this backstop keeps an
        // unexpected throw from stranding the app in the pending state.
        setState({ status: "unreachable" })
      }
    )
  }, [wiring])

  React.useEffect(() => {
    runBoot()
  }, [runBoot])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      state,
      signIn(credential: string) {
        return wiring.provider.signIn(credential).then((outcome) => {
          if (outcome.status === "signed-in") {
            setState({ status: "authenticated" })
          }
          return outcome
        })
      },
      async signOut() {
        await wiring.provider.revoke()
        setState({ status: "unauthenticated" })
      },
      retryBoot: runBoot,
    }),
    [state, wiring, runBoot]
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
