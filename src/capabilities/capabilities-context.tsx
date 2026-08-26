/* eslint-disable react-refresh/only-export-components */
// Precedent: auth-context.tsx. The context provider and its hook are one
// unit; splitting them across files would scatter the discovery lifecycle.
import * as React from "react"
import type { Gateway } from "@/api/gateway/client"
import type { CapabilityDocument, CapabilitiesStatus } from "./gating"

/**
 * The one read capability gating may ever be based on. Authenticated like
 * every /v1 route, cheap and stable by the contract's own description.
 */
const CAPABILITIES_PATH = "/v1/capabilities"

export interface CapabilitiesContextValue {
  status: CapabilitiesStatus
  /** The held document, or null whenever no answer currently stands. */
  document: CapabilityDocument | null
  /** Re-read after a failed discovery. */
  retry(): void
}

const CapabilitiesContext = React.createContext<
  CapabilitiesContextValue | undefined
>(undefined)

export interface CapabilitiesProviderProps {
  gateway: Gateway
  children: React.ReactNode
}

/**
 * Own capability discovery for the protected tree: read the document on
 * mount, refresh it when connectivity returns, and keep a failed read its
 * own state — a broken deployment never becomes an answer about what the
 * deployment can do. Mounted only around authenticated sessions; signed out,
 * nothing here exists and no request is sent.
 */
export function CapabilitiesProvider({
  gateway,
  children,
}: CapabilitiesProviderProps) {
  const [state, setState] = React.useState<{
    status: CapabilitiesStatus
    document: CapabilityDocument | null
  }>({ status: "loading", document: null })
  // Retrying, like reconnecting, means running the same read again: drop
  // whatever answer stood, move to pending, and let the attempt counter
  // re-trigger the effect. The reset lives here rather than in the effect so
  // the effect only ever settles an answer.
  const [attempt, setAttempt] = React.useState(0)
  // The reconnect listener reads this outside React's flow; a ref keeps it
  // current without re-binding the listener on every answer.
  const statusRef = React.useRef<CapabilitiesStatus>("loading")
  statusRef.current = state.status

  const restart = React.useCallback(() => {
    setState({ status: "loading", document: null })
    setAttempt((current) => current + 1)
  }, [])

  React.useEffect(() => {
    let alive = true
    gateway.request<CapabilityDocument>({ path: CAPABILITIES_PATH }).then(
      (document) => {
        if (alive && document !== undefined) {
          setState({ status: "ready", document })
        } else if (alive) {
          // A 2xx with no body is not an empty deployment; it is an answer
          // this client cannot use, so it decides nothing.
          setState({ status: "failed", document: null })
        }
      },
      () => {
        if (alive) setState({ status: "failed", document: null })
      }
    )
    return () => {
      alive = false
    }
  }, [gateway, attempt])

  React.useEffect(() => {
    // Connectivity returning after a lost answer chases that answer again.
    // A routine online event — wake-from-sleep, a network handoff — has
    // lost nothing: the held document stays authoritative instead of
    // flapping every gated surface through a pointless pending round.
    const refreshOnReconnect = () => {
      if (statusRef.current === "failed") restart()
    }
    window.addEventListener("online", refreshOnReconnect)
    return () => window.removeEventListener("online", refreshOnReconnect)
  }, [restart])

  const value = React.useMemo<CapabilitiesContextValue>(
    () => ({
      status: state.status,
      document: state.document,
      retry: restart,
    }),
    [state, restart]
  )

  return (
    <CapabilitiesContext.Provider value={value}>
      {children}
    </CapabilitiesContext.Provider>
  )
}

export function useCapabilities(): CapabilitiesContextValue {
  const context = React.useContext(CapabilitiesContext)
  if (context === undefined) {
    throw new Error(
      "useCapabilities must be used within a CapabilitiesProvider"
    )
  }
  return context
}
