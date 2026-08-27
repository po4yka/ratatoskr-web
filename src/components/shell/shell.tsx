import { Link, Outlet } from "react-router"
import { evaluateGate } from "@/capabilities/gating"
import { useCapabilities } from "@/capabilities/capabilities-context"
import { NAV_ENTRIES, type NavEntry } from "@/app/navigation"
import { ThemeSwitcher } from "@/components/shell/theme-switcher"
import { UserMenu } from "@/components/shell/user-menu"

export interface ShellProps {
  /**
   * The navigation registry to render. Production passes nothing and gets
   * the real one; tests inject fixtures through the same seam.
   */
  entries?: readonly NavEntry[]
}

/**
 * The protected shell: skip link, banner with primary navigation and the
 * account controls, main region. Navigation renders from the registry
 * filtered by each entry's capability verdict, so a destination the
 * deployment cannot honour never appears as a dead control. Every
 * interactive element is a native control reachable by keyboard with visible
 * focus; the layout holds in both themes through the semantic tokens.
 */
export function Shell({ entries = NAV_ENTRIES }: ShellProps) {
  const { status, document } = useCapabilities()
  const available = entries.filter(
    (entry) => evaluateGate(entry, { status, document }).state === "available"
  )
  const primary = available.filter((entry) => entry.group === undefined)
  const operational = available.filter((entry) => entry.group === "operations")

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
          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center gap-6"
          >
            <span className="text-subheading font-semibold">Ratatoskr</span>
            {primary.map((entry) => (
              <Link
                key={entry.id}
                to={entry.path}
                className="text-body text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {entry.label}
              </Link>
            ))}
            {operational.length > 0 ? (
              <span
                aria-label="Operations"
                className="flex flex-wrap items-center gap-3 border-l border-border pl-4"
                role="group"
              >
                {operational.map((entry) => (
                  <Link
                    key={entry.id}
                    to={entry.path}
                    className="text-body text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {entry.label}
                  </Link>
                ))}
              </span>
            ) : null}
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
