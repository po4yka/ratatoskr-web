import { Button } from "@/components/ui/button"

/**
 * The build request. A site that is not approved offers it disabled, with
 * the reason: a build reads only the publications of an approved manifest.
 */
export function BuildRequest({
  first,
  approved,
  onBuild,
}: {
  readonly first: boolean
  readonly approved: boolean
  readonly onBuild: () => void
}) {
  const again = "Approve the site again before a new release."
  const hint = first ? "Approve the site before the first release." : again
  return (
    <>
      {approved ? null : (
        <p className="text-body font-medium" id="site-release-hint">
          {hint}
        </p>
      )}
      <Button
        aria-describedby={approved ? undefined : "site-release-hint"}
        className="self-start"
        disabled={!approved}
        onClick={onBuild}
      >
        {first ? "Build the first release" : "Build a new release"}
      </Button>
    </>
  )
}
