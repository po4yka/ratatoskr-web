import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router"
import type { components } from "@/api/generated/schema"
import { Button } from "@/components/ui/button"
import { browserLocation, isOnHostname, signInRequestOf } from "./site-sign-in"
import { SiteDetails, Unapproved } from "./site-sign-in-details"
import {
  describeSitesFailure,
  type ActiveSiteManifest,
  type SiteManifestState,
  type SitesSource,
} from "./sites-source"

type SignInCodeRequest = components["schemas"]["SignInCodeRequest"]

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | {
      readonly kind: "ready"
      readonly site: SiteManifestState | undefined
      readonly manifest: ActiveSiteManifest
    }

type Step =
  | { readonly kind: "idle" }
  | { readonly kind: "pending" }
  | { readonly kind: "unapproved" }
  | { readonly kind: "problem"; readonly message: string }

/** Request the code, then leave for the callback page of the hostname. */
async function signIn(input: {
  readonly source: SitesSource
  readonly siteId: string
  readonly request: SignInCodeRequest
  readonly hostname: string
}): Promise<Step> {
  try {
    const issued = await input.source.signInCode(input.siteId, input.request)
    if (!isOnHostname(issued.redirect_url, input.hostname))
      return {
        kind: "problem",
        message:
          "The server gave a sign-in address on another host. Ratatoskr did not go there.",
      }
    browserLocation.replace(issued.redirect_url)
    return { kind: "pending" }
  } catch (failure) {
    if ((failure as { code?: unknown } | null)?.code === "sites.site_not_found")
      return { kind: "unapproved" }
    return {
      kind: "problem",
      message: describeSitesFailure(failure, "The sign-in was not approved."),
    }
  }
}

/** The confirmation of an approved site, and the answer to it. */
function Confirmation({
  siteId,
  source,
  request,
  site,
  manifest,
}: {
  readonly siteId: string
  readonly source: SitesSource
  readonly request: SignInCodeRequest | null
  readonly site: SiteManifestState | undefined
  readonly manifest: ActiveSiteManifest
}) {
  const [step, setStep] = useState<Step>({ kind: "idle" })
  if (site?.approval_state !== "approved" || step.kind === "unapproved")
    return <Unapproved siteId={siteId} />

  async function confirm() {
    if (request === null) return
    setStep({ kind: "pending" })
    setStep(
      await signIn({ source, siteId, request, hostname: manifest.hostname })
    )
  }

  return (
    <>
      <SiteDetails manifest={manifest} site={site} siteId={siteId} />
      <div className="flex flex-wrap items-center gap-4">
        <Button
          disabled={request === null || step.kind === "pending"}
          onClick={() => void confirm()}
        >
          {`Sign in to ${siteId}`}
        </Button>
        <Link
          className="inline-flex min-h-7 items-center text-body underline"
          to={`/sites/${encodeURIComponent(siteId)}`}
        >
          Do not sign in
        </Link>
      </div>
      <p aria-live="polite" className="text-body" role="status">
        {step.kind === "pending" ? "Approving the sign-in…" : null}
        {step.kind === "problem" ? step.message : null}
      </p>
    </>
  )
}

/**
 * `/sites/:siteId/sign-in`: the owner approves a sign-in that the site
 * started, and the client goes to the callback page of the site with a
 * single-use code.
 */
export function SiteSignInConsent({
  siteId,
  source,
}: {
  readonly siteId: string
  readonly source: SitesSource
}) {
  const [search] = useSearchParams()
  const [request] = useState(() => signInRequestOf(search))
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" })
  useEffect(() => {
    let alive = true
    Promise.all([source.sites(), source.manifest(siteId)]).then(
      ([sites, manifest]) =>
        alive &&
        setLoaded({
          kind: "ready",
          site: sites.find((entry) => entry.site_id === siteId),
          manifest,
        }),
      (failure: unknown) =>
        alive &&
        setLoaded({
          kind: "failed",
          message: describeSitesFailure(failure, "The site could not load."),
        })
    )
    return () => {
      alive = false
    }
  }, [source, siteId])

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-heading font-semibold">Sign in to {siteId}</h1>
      {request === null ? (
        <p className="text-body text-destructive" role="alert">
          The sign-in request of the site is not complete. Start the sign-in on
          the site again.
        </p>
      ) : null}
      {loaded.kind === "loading" ? <p role="status">Loading the site</p> : null}
      {loaded.kind === "failed" ? (
        <p className="text-body text-destructive" role="alert">
          {loaded.message}
        </p>
      ) : null}
      {loaded.kind === "ready" ? (
        <Confirmation
          manifest={loaded.manifest}
          request={request}
          site={loaded.site}
          siteId={siteId}
          source={source}
        />
      ) : null}
    </section>
  )
}
