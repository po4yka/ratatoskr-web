import { useTheme } from "@/components/theme-provider"

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const

/**
 * Light / dark / system, as three pressed-state buttons. `aria-pressed`
 * carries the active option so the choice is announced, not just colored;
 * persistence belongs to the ThemeProvider.
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center gap-1 rounded-lg border border-border p-1"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
          className="rounded-md px-2 py-1 text-caption font-medium text-muted-foreground hover:text-foreground aria-[pressed=true]:bg-background aria-[pressed=true]:text-foreground"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
