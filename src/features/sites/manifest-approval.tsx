import { useState } from "react"
import { ManifestDetails } from "./manifest-details"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  APPROVAL_TEXT,
  describeSitesFailure,
  manifestNote,
  PUBLIC_CAPABILITIES,
  type ActiveSiteManifest,
  type SiteManifestState,
  type SitesSource,
} from "./sites-source"

/** One group of capabilities, with what it means for the site. */
export function CapabilityGroup({
  id,
  title,
  summary,
  names,
}: {
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly names: readonly string[]
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1">
      <h3 className="text-body font-semibold" id={id}>
        {title}
      </h3>
      <p className="text-body text-muted-foreground">{summary}</p>
      {names.length === 0 ? (
        <p className="text-body">The manifest requests none.</p>
      ) : (
        <ul className="list-disc pl-6">
          {names.map((name) => (
            <li className="font-mono text-body" key={name}>
              {name}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** The requested capabilities: the public ones apart from the owner ones. */
function Capabilities({ names }: { readonly names: readonly string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <CapabilityGroup
        id="site-public-capabilities"
        names={names.filter((name) => PUBLIC_CAPABILITIES.includes(name))}
        summary="Any visitor of the site can use these, without a sign-in."
        title="Public capabilities"
      />
      <CapabilityGroup
        id="site-owner-capabilities"
        names={names.filter((name) => !PUBLIC_CAPABILITIES.includes(name))}
        summary="Only an owner session of the site can use these. You start one on the site, and you confirm it in Ratatoskr."
        title="Owner capabilities"
      />
    </div>
  )
}

function WithdrawDialog({
  siteId,
  open,
  onCancel,
  onConfirm,
}: {
  readonly siteId: string
  readonly open: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  return (
    <AlertDialog onOpenChange={(next) => !next && onCancel()} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Withdraw the approval of {siteId}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The site stops serving content at once, and it answers as a site
            that does not exist. Every owner session of the site ends. Its
            releases stay stored.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep the approval</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Withdraw approval
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** The active manifest of a site, its approval and its withdrawal. */
export function ManifestApproval({
  site,
  manifest,
  source,
  onChanged,
}: {
  readonly site: SiteManifestState
  readonly manifest: ActiveSiteManifest
  readonly source: SitesSource
  readonly onChanged: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [outcome, setOutcome] = useState<string | null>(null)
  const approved = site.approval_state === "approved"
  const current = approved
    ? site.approved_manifest_sha256 === manifest.manifest_sha256
    : false

  async function run(action: () => Promise<unknown>, done: string) {
    setPending(true)
    try {
      await action()
      setOutcome(done)
    } catch (failure) {
      setOutcome(describeSitesFailure(failure, "The change was not saved."))
    } finally {
      setPending(false)
      onChanged()
    }
  }

  return (
    <section
      aria-labelledby="site-manifest-heading"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-subtle"
    >
      <h2 className="text-heading-sm font-semibold" id="site-manifest-heading">
        Manifest
      </h2>
      <p className="text-body">
        Approval: {APPROVAL_TEXT[site.approval_state]}. {manifestNote(site)}
      </p>
      <ManifestDetails manifest={manifest} />
      <Capabilities names={manifest.capabilities} />
      <div className="flex flex-wrap gap-3">
        {current ? null : (
          <Button
            disabled={pending || manifest.github_repository == null}
            onClick={() =>
              void run(
                () => source.approve(manifest),
                "The manifest is approved."
              )
            }
          >
            Approve this manifest
          </Button>
        )}
        {approved ? (
          <Button
            disabled={pending}
            onClick={() => setConfirming(true)}
            variant="outline"
          >
            Withdraw the approval
          </Button>
        ) : null}
      </div>
      <p aria-live="polite" className="text-body" role="status">
        {outcome}
      </p>
      <WithdrawDialog
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          void run(
            () => source.withdraw(site.site_id),
            "The approval is withdrawn."
          )
        }}
        open={confirming}
        siteId={site.site_id}
      />
    </section>
  )
}
