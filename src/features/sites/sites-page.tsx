import { useMemo } from "react"
import { useMatch, useParams } from "react-router"
import { useGateway } from "@/api/gateway/context"
import { SiteRegistry } from "./site-registry"
import { SiteSignInConsent } from "./site-sign-in-consent"
import { SiteView } from "./site-view"
import { sitesSource } from "./sites-source"

/**
 * `/sites` lists the owner's sites; `/sites/:siteId` manages one;
 * `/sites/:siteId/sign-in` approves a sign-in of the owner on one.
 */
export default function SitesPage() {
  const gateway = useGateway()
  const source = useMemo(() => sitesSource(gateway), [gateway])
  const { siteId } = useParams()
  const signIn = useMatch("/sites/:siteId/sign-in")
  if (signIn?.params.siteId !== undefined)
    return (
      <SiteSignInConsent
        key={signIn.params.siteId}
        siteId={signIn.params.siteId}
        source={source}
      />
    )
  return siteId === undefined ? (
    <SiteRegistry source={source} />
  ) : (
    <SiteView key={siteId} siteId={siteId} source={source} />
  )
}
