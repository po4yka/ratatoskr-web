import { Button } from "@/components/ui/button"

export function App() {
  return (
    <main className="mx-auto flex min-h-svh max-w-prose flex-col gap-4 p-6">
      <h1 className="text-heading-sm font-semibold">Ratatoskr Web</h1>
      <p className="text-body text-muted-foreground">
        The toolchain is in place and nothing else is. There is no router, no
        API client, and no view yet — see{" "}
        <code>docs/IMPLEMENTATION_PLAN.md</code> for the order in which they
        arrive.
      </p>
      <div>
        <Button>Nothing to do yet</Button>
      </div>
    </main>
  )
}

export default App
