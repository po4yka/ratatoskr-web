import { Navigate, createBrowserRouter, useLocation } from "react-router"
import { Shell } from "@/components/shell/shell"
import CollectionsPage from "@/features/collections/collections-page"
import LoginPage from "@/features/login/login-page"
import SearchPage from "@/features/search/search-page"

/**
 * The route tree. `/login` is the one unauthenticated surface; everything
 * else renders inside the protected shell, and a visitor without a session
 * is redirected to `/login` carrying the URL they asked for, so sign-in can
 * return them there.
 */
export function createAppRouter(authenticated: boolean) {
  return createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    {
      path: "*",
      element: authenticated ? (
        <Shell />
      ) : (
        <RedirectToLogin />
      ),
      children: [
        { index: true, element: <SearchPage /> },
        { path: "collections", element: <CollectionsPage /> },
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
