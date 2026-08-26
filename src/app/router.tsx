import { lazy, Suspense, type ComponentType } from "react"
import { createBrowserRouter } from "react-router"
import { RedirectToLogin, RouteNotFound } from "@/app/gate-surfaces"
import { GatedRoute } from "@/app/gated-route"
import { NAV_ENTRIES, type NavEntry } from "@/app/navigation"
import { Shell } from "@/components/shell/shell"
import { RoutePending } from "@/components/shell/route-pending"
import LoginPage from "@/features/login/login-page"

/** A feature view's module shape: the default export is what renders. */
export interface FeatureModule {
  default: ComponentType
}

export type FeatureModuleLoader = () => Promise<FeatureModule>

/**
 * Test seam for route modules. Production never passes it, so every route
 * keeps its own dynamic import and Vite splits each into its own chunk.
 */
export interface RouteModules {
  search?: FeatureModuleLoader
  collections?: FeatureModuleLoader
}

/**
 * What a caller may override when building the router. Production passes
 * nothing; tests inject fixture modules and registries through the same
 * seams the real tree reads.
 */
export interface RouterSeams {
  routeModules?: RouteModules
  navEntries?: readonly NavEntry[]
}

const defaultSearch = () => import("@/features/search/search-page")
const defaultCollections = () =>
  import("@/features/collections/collections-page")

/**
 * The route tree. `/login` is the one unauthenticated surface; everything
 * else renders inside the protected shell, and a visitor without a session
 * is redirected to `/login` carrying the URL they asked for. Feature routes
 * sit behind their registry entry's capability gate — the same wrapper for
 * clicked links and direct URLs — and load lazily inside their Suspense
 * region, so a slow chunk holds one pending region on cold entry while the
 * shell stays put.
 */
export function createAppRouter(
  authenticated: boolean,
  seams: RouterSeams = {}
) {
  const navEntries = seams.navEntries ?? NAV_ENTRIES
  const SearchRoute = lazy(seams.routeModules?.search ?? defaultSearch)
  const CollectionsRoute = lazy(
    seams.routeModules?.collections ?? defaultCollections
  )

  /**
   * Wrap a feature region in the gate its registry entry declares. The lookup
   * is the contract every new route keeps: an id the registry carries is gated
   * by that entry's requirement, and an id it does not carry is ungated by
   * declaration — features declare their gates here, so a route added without
   * a registry entry is claiming to belong to every deployment, and review
   * should read that claim as deliberate.
   */
  function gated(id: string, children: React.ReactElement): React.ReactElement {
    const entry = navEntries.find((candidate) => candidate.id === id)
    if (entry === undefined) return children
    return <GatedRoute entry={entry}>{children}</GatedRoute>
  }

  return createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    {
      path: "*",
      element: authenticated ? (
        <Shell entries={navEntries} />
      ) : (
        <RedirectToLogin />
      ),
      children: [
        {
          index: true,
          element: gated(
            "search",
            <Suspense fallback={<RoutePending />}>
              <SearchRoute />
            </Suspense>
          ),
        },
        {
          path: "collections",
          element: gated(
            "collections",
            <Suspense fallback={<RoutePending />}>
              <CollectionsRoute />
            </Suspense>
          ),
        },
        { path: "*", element: <RouteNotFound /> },
      ],
    },
  ])
}
