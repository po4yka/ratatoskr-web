import type { components } from "@/api/generated/schema"

type SignInCodeRequest = components["schemas"]["SignInCodeRequest"]

/** A PKCE S256 challenge: 43 base64url characters. */
const CHALLENGE = /^[A-Za-z0-9_-]{43}$/

/** The largest return path that Platform accepts, in bytes. */
const MAX_RETURN_BYTES = 1024

/**
 * The request of the site in the address of the consent page, or `null`
 * when it is not complete. Platform checks both values again.
 */
export function signInRequestOf(
  search: URLSearchParams
): SignInCodeRequest | null {
  const challenge = search.get("challenge") ?? ""
  const returnPath = search.get("return") ?? ""
  if (!CHALLENGE.test(challenge)) return null
  if (!returnPath.startsWith("/") || returnPath.startsWith("//")) return null
  if (new TextEncoder().encode(returnPath).length > MAX_RETURN_BYTES)
    return null
  return { challenge, return_path: returnPath }
}

/** The path of the callback page that every site bundle ships. */
const CALLBACK_PATH = "/.ratatoskr/sign-in/"

/**
 * Whether `url` is the callback page on the approved `hostname`: HTTPS,
 * no port, no user name or password, and the path `/.ratatoskr/sign-in/`.
 */
export function isSignInCallback(url: string, hostname: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === "https:" &&
      parsed.host === hostname &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.pathname === CALLBACK_PATH
    )
  } catch {
    return false
  }
}

/**
 * The one place where the consent page leaves this client for the site. A
 * test replaces `replace`, because jsdom does not navigate.
 */
export const browserLocation = {
  replace(url: string): void {
    window.location.replace(url)
  },
}
