import type { ReactElement } from "react"
import { render } from "@testing-library/react"
import { ThemeProvider } from "@/components/theme-provider"
import type { RouteModules } from "@/app/router"
import type { NavEntry } from "@/app/navigation"
import {
  createPresentedCredentialProvider,
  type PresentedCredentialProvider,
} from "@/auth/provider"
import type { SessionWiring } from "@/auth/session-gateway"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import App from "@/App"

/** A Gateway double whose request function returns whatever the test needs. */
export function gatewayOf(
  run: (request: GatewayRequest) => Promise<unknown>
): Gateway {
  return {
    request: run as unknown as Gateway["request"],
  }
}

export interface HarnessOptions {
  gateway: Gateway
  /** Swap in a provider double (for spying on revoke and friends). */
  provider?: PresentedCredentialProvider
  routeModules?: RouteModules
  /** Override the primary-navigation registry (gating fixtures ride in here). */
  navEntries?: readonly NavEntry[]
}

/**
 * Render the application the way main.tsx composes it — global providers
 * around the app root — with the session seam injected. Every test that
 * mounts <App /> goes through here so the composition under test stays one.
 */
export function renderApp(options: HarnessOptions): {
  wiring: SessionWiring
} & ReturnType<typeof render> {
  const provider =
    options.provider ??
    createPresentedCredentialProvider({ gateway: options.gateway })
  const wiring: SessionWiring = { gateway: options.gateway, provider }

  let tree: ReactElement = (
    <App
      wiring={wiring}
      routeModules={options.routeModules}
      navEntries={options.navEntries}
      publicGateway={options.gateway}
    />
  )
  tree = <ThemeProvider>{tree}</ThemeProvider>

  return { wiring, ...render(tree) }
}
