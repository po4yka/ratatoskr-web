import type { ActiveSiteManifest } from "./sites-source"

/** The exact manifest identity that the owner approves. */
export function ManifestDetails({
  manifest,
}: {
  readonly manifest: ActiveSiteManifest
}) {
  return (
    <>
      <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1 text-body">
        <dt className="font-medium">GitHub repository</dt>
        <dd className="min-w-0 break-all">
          {manifest.github_repository?.repository ?? "Not bound"}
        </dd>
        <dt className="font-medium">Repository ID</dt>
        <dd className="min-w-0 font-mono break-all">
          {manifest.github_repository?.repository_id ?? "Not bound"}
        </dd>
        <dt className="font-medium">Hostname</dt>
        <dd className="min-w-0 break-all">{manifest.hostname}</dd>
        <dt className="font-medium">Publications</dt>
        <dd className="min-w-0 break-all">
          {manifest.publications.join(", ")}
        </dd>
        <dt className="font-medium">Digest</dt>
        <dd className="font-mono break-all">{manifest.manifest_sha256}</dd>
      </dl>
      {manifest.github_repository == null ? (
        <p className="text-body">
          Submit a manifest with a GitHub repository and its numeric ID before
          approval.
        </p>
      ) : null}
    </>
  )
}
