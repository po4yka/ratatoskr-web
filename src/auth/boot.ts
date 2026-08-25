import type { AuthProvider } from "./provider"

/**
 * The one boot decision, resolved before any application route renders. The
 * three outcomes are exactly the states the shell can act on: render it,
 * render the unauthorized surface, or render a boot failure with a retry.
 */
export type BootOutcome =
  | { status: "authenticated" }
  | { status: "unauthenticated" }
  | { status: "unreachable" }

/**
 * Ask the provider where the session stands. Sequencing lives here so React
 * awaits one promise and every future boot step (capability fetch for item 5,
 * reconnect re-probes) joins the same seam.
 */
export async function resolveBoot(
  provider: AuthProvider
): Promise<BootOutcome> {
  const status = await provider.probe()
  return { status }
}
