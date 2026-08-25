import { Outlet } from "react-router"

/**
 * The protected shell's semantic skeleton: banner, primary navigation, main
 * region. The interactive surface — skip link, theme switcher, user menu —
 * is added by the shell tasks; this layout is the structure everything else
 * hangs from.
 */
export function Shell() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-background">
        <nav aria-label="Primary" className="mx-auto flex max-w-5xl gap-6 p-4">
          <span className="text-subheading font-semibold">Ratatoskr</span>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
