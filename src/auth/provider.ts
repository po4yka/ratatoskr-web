import type { Gateway, TokenSource } from "@/api/gateway/client"
import type { ApiError } from "@/api/gateway/errors"
import type { paths } from "@/api/generated/schema"
import { discardCustody, readCustody, storeCustody } from "./custody"

/**
 * How the last attempt to establish session truth resolved. Three outcomes,
 * because boot branches on exactly these: Platform authenticated the
 * credential, Platform refused it, or Platform could not be asked at all
 * (transport loss, or an answer this client cannot use).
 */
export type SessionStatus = "authenticated" | "unauthenticated" | "unreachable"

/** How a sign-in attempt ended. Refusal and failure stay distinct. */
export type SignInOutcome =
  { status: "signed-in" } | { status: "refused" } | { status: "unreachable" }

/**
 * What the injected credential refresh reported, shaped for the gateway's
 * coordinator. This contract version mints sessions once and defines no
 * refresh endpoint, so the only truthful answer today is "rejected".
 */
export type RefreshResult =
  { status: "refreshed" } | { status: "rejected" } | { status: "network" }

/**
 * One interface over the session operations the client performs. Modes sit
 * behind it — the presented-credential mode ships here; a Telegram-assertion
 * mode implements the same shape against POST /v1/sessions/telegram when its
 * assertions become reachable, and a username/password mode when Platform
 * grows that endpoint. Boot, sign-out, and the shell depend on this shape
 * only.
 */
export interface AuthProvider {
  /** Resolve the standing session, probing stored custody when held. */
  probe(): Promise<SessionStatus>
  /** Present a credential for sign-in. Custody moves only on acceptance. */
  signIn(credential: string): Promise<SignInOutcome>
  /** Answer the gateway's single-flight refresh coordinator. */
  refresh(): Promise<RefreshResult>
  /** End the session through this provider, whatever the mode does locally. */
  revoke(): Promise<void>
}

export interface PresentedCredentialProvider extends AuthProvider {
  /**
   * The token source every request through the composed gateway reads. The
   * candidate under verification wins; stored custody otherwise.
   */
  tokenSource: TokenSource
}

export interface PresentedCredentialProviderDeps {
  /** The session gateway this provider is composed with. */
  gateway: Gateway
}

/**
 * The authenticated read every /v1 route shares: cheap, stable, and defined
 * by the pinned contract rather than invented here.
 */
const PROBE_PATH: keyof paths = "/v1/capabilities"

type AskOutcome =
  { verdict: "accepted" } | { verdict: "refused" } | { verdict: "unreachable" }

/**
 * The one mode the pinned contract supports end to end today: a user
 * presents a Platform bearer credential they already hold, the provider asks
 * Platform about it before taking custody, and an unusable credential never
 * becomes custody.
 */
export function createPresentedCredentialProvider(
  deps: PresentedCredentialProviderDeps
): PresentedCredentialProvider {
  // While a sign-in is being verified, requests carry the candidate instead
  // of stored custody. Nothing else runs concurrently on the sign-in screen,
  // and the candidate clears in `finally`, so it cannot outlive the check.
  let candidate: string | null = null

  const tokenSource: TokenSource = {
    current(): string | null {
      return candidate ?? readCustody()
    },
  }

  function ask(): Promise<AskOutcome> {
    return deps.gateway
      .request({ path: PROBE_PATH })
      .then(
        (): AskOutcome => ({ verdict: "accepted" }),
        (failure: unknown): AskOutcome => classify(failure)
      )
      .finally(() => {
        candidate = null
      })
  }

  return {
    tokenSource,

    async probe(): Promise<SessionStatus> {
      if (readCustody() === null) {
        // No custody, no wire call: the client already knows this answer.
        return "unauthenticated"
      }

      const { verdict } = await ask()
      if (verdict === "refused") {
        // Platform refused the stored credential: it is dead, not merely
        // unreadable. Keeping it would boot-loop the next reload.
        discardCustody()
        return "unauthenticated"
      }
      return verdict === "accepted" ? "authenticated" : "unreachable"
    },

    async signIn(credential: string): Promise<SignInOutcome> {
      candidate = credential
      const { verdict } = await ask()
      if (verdict === "accepted") {
        storeCustody(credential)
        return { status: "signed-in" }
      }
      return {
        status: verdict === "refused" ? "refused" : "unreachable",
      }
    },

    async refresh(): Promise<RefreshResult> {
      // Truthful by construction: the pinned contract defines no refresh
      // endpoint, so a mid-use refusal is the end of the session. When
      // Platform grows one, only this body changes.
      return { status: "rejected" }
    },

    async revoke(): Promise<void> {
      // Server-side revocation has no contract path yet; the confirmation
      // copy beside the sign-out control says what actually happened. The
      // workspace-changeset prerequisite records the missing endpoint.
      candidate = null
      discardCustody()
    },
  }
}

function classify(failure: unknown): AskOutcome {
  const error = failure as Partial<ApiError> | undefined
  if (error !== null && typeof error === "object" && "kind" in error) {
    switch (error.kind) {
      case "unauthenticated":
      case "revoked":
        return { verdict: "refused" }
      default:
        break
    }
  }
  // Transport loss, or an answer that cannot establish session truth: a
  // broken deployment is not a signed-out user.
  return { verdict: "unreachable" }
}
