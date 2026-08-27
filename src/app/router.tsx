import { lazy, type ComponentType } from "react"
import { createBrowserRouter } from "react-router"
import { RedirectToLogin, RouteNotFound } from "@/app/gate-surfaces"
import FeatureRoute from "@/app/feature-route"
import { NAV_ENTRIES, type NavEntry } from "@/app/navigation"
import { Shell } from "@/components/shell/shell"
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
  capture?: FeatureModuleLoader
  operations?: FeatureModuleLoader
  reader?: FeatureModuleLoader
  tags?: FeatureModuleLoader
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
const defaultCapture = () => import("@/features/capture/capture-page")
const defaultOperations = () => import("@/features/operations/operation-page")
const defaultReader = () => import("@/features/reader/reader-page")
const defaultTags = () => import("@/features/tags/tags-page")

// eslint-disable-next-line complexity -- this mirrors the fixed lazy-route registry.
function resolveRouteModules(seams: RouterSeams): Required<RouteModules> {
  return {
    search: seams.routeModules?.search ?? defaultSearch,
    collections: seams.routeModules?.collections ?? defaultCollections,
    capture: seams.routeModules?.capture ?? defaultCapture,
    operations: seams.routeModules?.operations ?? defaultOperations,
    reader: seams.routeModules?.reader ?? defaultReader,
    tags: seams.routeModules?.tags ?? defaultTags,
  }
}

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
  const navEntries = resolveNavigation(seams)
  const modules = resolveRouteModules(seams)
  const SearchRoute = lazy(modules.search)
  const CollectionsRoute = lazy(modules.collections)
  const CaptureRoute = lazy(modules.capture)
  const OperationsRoute = lazy(modules.operations)
  const ReaderRoute = lazy(modules.reader)
  const TagsRoute = lazy(modules.tags)

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
          path: "capture",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "capture")}
              view={CaptureRoute}
            />
          ),
        },
        {
          path: "operations/:operationId",
          element: <FeatureRoute view={OperationsRoute} />,
        },
        {
          index: true,
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "search")}
              view={SearchRoute}
            />
          ),
        },
        {
          path: "collections",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "collections")}
              view={CollectionsRoute}
            />
          ),
        },
        {
          path: "collections/:collectionId",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "collections")}
              view={CollectionsRoute}
            />
          ),
        },
        {
          path: "tags",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "tags")}
              view={TagsRoute}
            />
          ),
        },
        {
          path: "documents/:documentId",
          element: <FeatureRoute view={ReaderRoute} />,
        },
        { path: "*", element: <RouteNotFound /> },
      ],
    },
  ])
}

function resolveNavigation(seams: RouterSeams): readonly NavEntry[] {
  return seams.navEntries ?? NAV_ENTRIES
}
