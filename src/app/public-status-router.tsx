import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider } from "react-router"
import { RouteFocusManager } from "@/app/route-focus"

const StatusPage = lazy(() => import("@/features/status/status-page"))

function StatusRoutePending() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <p role="status" className="text-body text-muted-foreground">
        Loading public status…
      </p>
    </main>
  )
}

/** The anonymous route tree. It mounts no session or capability provider. */
export function PublicStatusRouter() {
  const router = createBrowserRouter([
    {
      path: "/status",
      element: (
        <>
          <RouteFocusManager mainId="status-main" />
          <Suspense fallback={<StatusRoutePending />}>
            <StatusPage />
          </Suspense>
        </>
      ),
    },
  ])
  return <RouterProvider router={router} />
}
