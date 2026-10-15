import { useMemo } from "react"
import { useParams } from "react-router"
import { useGateway } from "@/api/gateway/context"
import { SiteRegistry } from "./site-registry"
import { SiteView } from "./site-view"
import { sitesSource } from "./sites-source"

/** `/sites` lists the owner's sites; `/sites/:siteId` manages one. */
export default function SitesPage() {
  const gateway = useGateway()
  const source = useMemo(() => sitesSource(gateway), [gateway])
  const { siteId } = useParams()
  return siteId === undefined ? (
    <SiteRegistry source={source} />
  ) : (
    <SiteView key={siteId} siteId={siteId} source={source} />
  )
}
