import { lazy, Suspense, type ComponentType } from "react"
import { Navigate, createBrowserRouter, useLocation } from "react-router"
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

const defaultSearch = () => import("@/features/search/search-page")
const defaultCollections = () =>
  import("@/features/collections/collections-page")

/**
 * The route tree. `/login` is the one unauthenticated surface; everything
 * else renders inside the protected shell, and a visitor without a session
 * is redirected to `/login` carrying the URL they asked for. Feature views
 * load lazily inside their Suspense region, so a slow chunk holds one
 * pending region while the shell stays put.
 */
export function createAppRouter(
  authenticated: boolean,
  routeModules: RouteModules = {}
) {
  const SearchRoute = lazy(routeModules.search ?? defaultSearch)
  const CollectionsRoute = lazy(
    routeModules.collections ?? defaultCollections
  )

  return createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    {
      path: "*",
      element: authenticated ? <Shell /> : <RedirectToLogin />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<RoutePending />}>
              <SearchRoute />
            </Suspense>
          ),
        },
        {
          path: "collections",
          element: (
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

function RedirectToLogin() {
  const location = useLocation()
  const from = `${location.pathname}${location.search}${location.hash}`
  return <Navigate to="/login" replace state={{ from }} />
}

function RouteNotFound() {
  return (
    <section>
      <h1 className="text-heading-sm font-semibold">Nothing lives here</h1>
      <p className="text-body text-muted-foreground">
        The address does not match a page in this client.
      </p>
    </section>
  )
}
