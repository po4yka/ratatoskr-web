import { Suspense, type ComponentType } from "react"
import type { NavEntry } from "@/app/navigation"
import { GatedRoute } from "@/app/gated-route"
import { RoutePending } from "@/components/shell/route-pending"

export default function FeatureRoute({
  entry,
  view: View,
}: {
  entry?: NavEntry
  view: ComponentType
}) {
  const content = (
    <Suspense fallback={<RoutePending />}>
      <View />
    </Suspense>
  )
  return entry ? <GatedRoute entry={entry}>{content}</GatedRoute> : content
}
