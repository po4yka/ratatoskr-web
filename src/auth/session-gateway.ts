import {
  createGateway,
  type Gateway,
  type GatewayDeps,
} from "@/api/gateway/client"
import {
  createPresentedCredentialProvider,
  type PresentedCredentialProvider,
} from "./provider"

export interface SessionWiring {
  /** The gateway every feature call and the provider's own probe share. */
  gateway: Gateway
  /** The auth provider wired to that gateway's token source and refresh hook. */
  provider: PresentedCredentialProvider
}

/**
 * Compose the one session gateway: its token source reads the provider's
 * candidate-or-custody answer per attempt, its single-flight refresh
 * coordinator asks the provider (which answers truthfully for this contract
 * version), and a confirmed revocation ends the whole session — custody
 * discarded, listeners told — before the revoked error reaches the caller.
 */
export function wireSessions(
  deps: Omit<GatewayDeps, "tokenSource" | "refresher" | "onSessionRevoked"> & {
    onSessionRevoked?: () => void
  }
): SessionWiring {
  // The gateway needs the provider for refresh and revocation while the
  // provider needs the gateway to probe through. The holder breaks that
  // cycle explicitly; it is filled before either callback can ever run,
  // because nothing sends a request until a caller does.
  const wired: { provider?: PresentedCredentialProvider } = {}

  const gateway = createGateway({
    ...deps,
    tokenSource: {
      current: () => wired.provider?.tokenSource.current() ?? null,
    },
    refresher: () => {
      if (wired.provider === undefined) {
        throw new Error("session wiring used before it finished composing")
      }
      return wired.provider.refresh()
    },
    onSessionRevoked: () => {
      void wired.provider?.revoke()
      deps.onSessionRevoked?.()
    },
  })

  const provider = createPresentedCredentialProvider({ gateway })
  wired.provider = provider

  return { gateway, provider }
}
