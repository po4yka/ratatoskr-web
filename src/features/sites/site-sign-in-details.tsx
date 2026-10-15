import { Link } from "react-router"
import { CapabilityGroup } from "./manifest-approval"
import { PUBLIC_CAPABILITIES, type ActiveSiteManifest } from "./sites-source"

/** A site that is not approved gets no owner session. */
export function Unapproved({ siteId }: { readonly siteId: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-body" role="alert">
        You did not approve this site, so it cannot get an owner session.
        Approve the site first, then start the sign-in on the site again.
      </p>
      <Link
        className="inline-flex min-h-7 items-center self-start text-body font-medium underline"
        to={`/sites/${encodeURIComponent(siteId)}`}
      >
        Approve the site
      </Link>
    </div>
  )
}

/**
 * A new manifest waits for approval. Platform binds a sign-in to the
 * approved manifest, whose hostname and capabilities no read route
 * answers, so the page offers no sign-in until the owner approves it.
 */
export function PendingManifest({ siteId }: { readonly siteId: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-body" role="alert">
        A new manifest of this site waits for your approval. Its hostname or its
        capabilities can differ from the approved ones, so Ratatoskr does not
        sign you in now. Approve the new manifest, then start the sign-in on the
        site again.
      </p>
      <Link
        className="inline-flex min-h-7 items-center self-start text-body font-medium underline"
        to={`/sites/${encodeURIComponent(siteId)}`}
      >
        Approve the new manifest
      </Link>
    </div>
  )
}

/** The site, its hostname and what an owner session of it can use. */
export function SiteDetails({
  siteId,
  manifest,
}: {
  readonly siteId: string
  readonly manifest: ActiveSiteManifest
}) {
  return (
    <>
      <p className="text-body">
        The site asks for an owner session. With it, the site can use the owner
        capabilities below for you, on this site only.
      </p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-body">
        <dt className="font-medium">Site</dt>
        <dd>{siteId}</dd>
        <dt className="font-medium">Hostname</dt>
        <dd className="break-all">{manifest.hostname}</dd>
      </dl>
      <div className="flex flex-col gap-4">
        <CapabilityGroup
          id="sign-in-owner-capabilities"
          names={manifest.capabilities.filter(
            (name) => !PUBLIC_CAPABILITIES.includes(name)
          )}
          summary="The owner session can use these."
          title="Owner capabilities"
        />
        <CapabilityGroup
          id="sign-in-public-capabilities"
          names={manifest.capabilities.filter((name) =>
            PUBLIC_CAPABILITIES.includes(name)
          )}
          summary="Any visitor of the site can use these, without a sign-in."
          title="Public capabilities"
        />
      </div>
      <p className="text-body text-muted-foreground">
        The session ends after 12 hours, or after 1 hour without use. You can
        end it earlier in Sessions, in the account menu.
      </p>
    </>
  )
}
