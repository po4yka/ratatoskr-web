import { Link, Outlet } from "react-router"
import { ThemeSwitcher } from "@/components/shell/theme-switcher"
import { UserMenu } from "@/components/shell/user-menu"

/**
 * The protected shell: skip link, banner with primary navigation and the
 * account controls, main region. Every interactive element is a native
 * control reachable by keyboard with visible focus; the layout holds in both
 * themes through the semantic tokens.
 */
export function Shell() {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-body focus:font-medium focus:ring-3 focus:ring-ring/50"
      >
        Skip to content
      </a>

      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
          <nav aria-label="Primary" className="flex items-center gap-6">
            <span className="text-subheading font-semibold">Ratatoskr</span>
            <Link
              to="/"
              className="text-body text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Search
            </Link>
            <Link
              to="/collections"
              className="text-body text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Collections
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <UserMenu />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
