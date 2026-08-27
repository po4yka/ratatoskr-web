import { lazy, type ComponentType } from "react"
import { createBrowserRouter } from "react-router"
import { RedirectToLogin, RouteNotFound } from "@/app/gate-surfaces"
import FeatureRoute from "@/app/feature-route"
import { NAV_ENTRIES, type NavEntry } from "@/app/navigation"
import { Shell } from "@/components/shell/shell"
import LoginPage from "@/features/login/login-page"

/* eslint-disable max-lines -- The fixed lazy route registry is one audit-friendly route tree. */

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
  github?: FeatureModuleLoader
  vault?: FeatureModuleLoader
  social?: FeatureModuleLoader
  aiArchive?: FeatureModuleLoader
  connections?: FeatureModuleLoader
  operationsAdmin?: FeatureModuleLoader
  operationAdminDetail?: FeatureModuleLoader
  schedulesAdmin?: FeatureModuleLoader
  auditAdmin?: FeatureModuleLoader
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
const defaultGithub = () =>
  import("@/features/github-vault/github-catalog-page")
const defaultVault = () => import("@/features/github-vault/git-vault-page")
const defaultSocial = () =>
  import("@/features/social-ai-archive/social-posts-page")
const defaultAiArchive = () =>
  import("@/features/social-ai-archive/ai-archive-page")
const defaultConnections = () =>
  import("@/features/social-ai-archive/connections-page")
const defaultOperationsAdmin = () =>
  import("@/features/operations-admin/operations-page")
const defaultOperationAdminDetail = () =>
  import("@/features/operations-admin/operation-detail-page")
const defaultSchedulesAdmin = () =>
  import("@/features/operations-admin/schedules-page")
const defaultAuditAdmin = () => import("@/features/operations-admin/audit-page")

// eslint-disable-next-line complexity -- this mirrors the fixed lazy-route registry.
function resolveRouteModules(seams: RouterSeams): Required<RouteModules> {
  return {
    search: seams.routeModules?.search ?? defaultSearch,
    collections: seams.routeModules?.collections ?? defaultCollections,
    capture: seams.routeModules?.capture ?? defaultCapture,
    operations: seams.routeModules?.operations ?? defaultOperations,
    reader: seams.routeModules?.reader ?? defaultReader,
    tags: seams.routeModules?.tags ?? defaultTags,
    github: seams.routeModules?.github ?? defaultGithub,
    vault: seams.routeModules?.vault ?? defaultVault,
    social: seams.routeModules?.social ?? defaultSocial,
    aiArchive: seams.routeModules?.aiArchive ?? defaultAiArchive,
    connections: seams.routeModules?.connections ?? defaultConnections,
    operationsAdmin:
      seams.routeModules?.operationsAdmin ?? defaultOperationsAdmin,
    operationAdminDetail:
      seams.routeModules?.operationAdminDetail ?? defaultOperationAdminDetail,
    schedulesAdmin: seams.routeModules?.schedulesAdmin ?? defaultSchedulesAdmin,
    auditAdmin: seams.routeModules?.auditAdmin ?? defaultAuditAdmin,
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
// eslint-disable-next-line max-lines-per-function -- The route registry is intentionally adjacent for direct-route review.
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
  const GithubRoute = lazy(modules.github)
  const VaultRoute = lazy(modules.vault)
  const SocialRoute = lazy(modules.social)
  const AiArchiveRoute = lazy(modules.aiArchive)
  const ConnectionsRoute = lazy(modules.connections)
  const OperationsAdminRoute = lazy(modules.operationsAdmin)
  const OperationAdminDetailRoute = lazy(modules.operationAdminDetail)
  const SchedulesAdminRoute = lazy(modules.schedulesAdmin)
  const AuditAdminRoute = lazy(modules.auditAdmin)

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
          path: "github",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "github")}
              view={GithubRoute}
            />
          ),
        },
        {
          path: "github/:repositoryId",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "github")}
              view={GithubRoute}
            />
          ),
        },
        {
          path: "vault",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "vault")}
              view={VaultRoute}
            />
          ),
        },
        {
          path: "vault/:mirrorId",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "vault")}
              view={VaultRoute}
            />
          ),
        },
        ...socialRoutes(navEntries, SocialRoute),
        {
          path: "archives/chatgpt/:view?/:itemId?",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "chatgpt-archive")}
              view={AiArchiveRoute}
            />
          ),
        },
        {
          path: "archives/claude/:view?/:itemId?",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "claude-archive")}
              view={AiArchiveRoute}
            />
          ),
        },
        {
          path: "connections",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "connections")}
              view={ConnectionsRoute}
            />
          ),
        },
        {
          path: "ops",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "ops")}
              view={OperationsAdminRoute}
            />
          ),
        },
        {
          path: "ops/operations/:operationId",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "ops")}
              view={OperationAdminDetailRoute}
            />
          ),
        },
        {
          path: "ops/schedules",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "ops-schedules")}
              view={SchedulesAdminRoute}
            />
          ),
        },
        {
          path: "ops/audit",
          element: (
            <FeatureRoute
              entry={navEntries.find((entry) => entry.id === "ops-audit")}
              view={AuditAdminRoute}
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

function socialRoutes(
  navEntries: readonly NavEntry[],
  SocialRoute: ComponentType
) {
  return ["x", "instagram", "threads"].map((provider) => ({
    path: `social/${provider}/:postId?`,
    element: (
      <FeatureRoute
        entry={navEntries.find(
          (entry) => entry.id === `social-${provider}` || entry.id === provider
        )}
        view={SocialRoute}
      />
    ),
  }))
}

function resolveNavigation(seams: RouterSeams): readonly NavEntry[] {
  return seams.navEntries ?? NAV_ENTRIES
}
