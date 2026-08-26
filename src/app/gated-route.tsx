import type { ReactElement } from "react"
import {
  CapabilityUnavailable,
  CapabilityUndecidable,
} from "@/app/gate-surfaces"
import type { NavEntry } from "@/app/navigation"
import { evaluateGate } from "@/capabilities/gating"
import { useCapabilities } from "@/capabilities/capabilities-context"
import { RoutePending } from "@/components/shell/route-pending"

/**
 * The gate a feature route sits behind: the registry entry for the route's
 * feature id decides, and the verdict picks the surface. A direct URL meets
 * the same wrapper as a clicked link, so deep links cannot go around it.
 */
export function GatedRoute({
  entry,
  children,
}: {
  entry: NavEntry
  children: ReactElement
}) {
  const { status, document, retry } = useCapabilities()
  const verdict = evaluateGate(entry, { status, document })

  switch (verdict.state) {
    case "available":
      return children
    case "pending":
      return <RoutePending />
    case "undecidable":
      return <CapabilityUndecidable onRetry={retry} />
    case "unavailable":
      return <CapabilityUnavailable />
  }
}
