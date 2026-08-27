import { useEffect } from "react"
import type { components } from "@/api/generated/schema"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/shell/theme-switcher"
import { usePublicStatus } from "@/features/status/use-public-status"

type Component = components["schemas"]["PublicStatusComponent"]
const componentNames: Record<Component["id"], string> = {
  api: "API",
  storage: "Storage",
  command_delivery: "Command delivery",
  connected_services: "Connected services",
}

function sentence(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1).replaceAll("_", " ")}`
}

function StatusCard({
  component,
  retained,
}: {
  component: Component
  retained: boolean
}) {
  const stale = component.stale || retained
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-subheading font-semibold">
          {componentNames[component.id]}
        </h2>
        <p className="text-body font-medium">{sentence(component.state)}</p>
      </div>
      <p className="mt-3 text-body text-muted-foreground">
        {stale ? "Stale observation" : "Current observation"}
      </p>
      {component.observed_at ? (
        <p className="mt-1 text-caption text-muted-foreground">
          Observed{" "}
          <time dateTime={component.observed_at}>
            {new Date(component.observed_at).toLocaleString()}
          </time>
        </p>
      ) : (
        <p className="mt-1 text-caption text-muted-foreground">
          No successful observation yet
        </p>
      )}
    </article>
  )
}

export default function StatusPage() {
  const { loadState, retry, statusDocument } = usePublicStatus()

  useEffect(() => {
    const previousTitle = document.title
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    )
    const previousDescription = description?.content
    document.title = "System status · Ratatoskr"
    if (description)
      description.content =
        "Current public availability of this Ratatoskr deployment."
    return () => {
      document.title = previousTitle
      if (description && previousDescription)
        description.content = previousDescription
    }
  }, [])

  const retained = loadState === "failed" && statusDocument !== null

  return (
    <div className="min-h-svh">
      <a
        href="#status-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-body focus:font-medium focus:ring-3 focus:ring-ring/50"
      >
        Skip to status
      </a>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
          <a className="text-subheading font-semibold" href="/">
            Ratatoskr
          </a>
          <ThemeSwitcher />
        </div>
      </header>
      <main
        id="status-main"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 outline-none sm:p-6"
      >
        <header className="flex flex-col gap-2 pt-4">
          <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            Public service health
          </p>
          <h1 className="text-heading font-semibold">System status</h1>
          <p className="max-w-2xl text-body text-muted-foreground">
            Sanitized availability from this deployment. No account or archive
            data appears here.
          </p>
        </header>

        {loadState === "loading" ? (
          <section
            aria-busy="true"
            role="status"
            className="rounded-xl border border-border bg-card p-5 shadow-subtle"
          >
            <h2 className="text-subheading font-semibold">
              Loading current status
            </h2>
            <p className="mt-2 text-body text-muted-foreground">
              Reading the latest cached Platform observation.
            </p>
          </section>
        ) : null}

        {loadState === "failed" ? (
          <section
            role="alert"
            className="rounded-xl border border-border bg-card p-5 shadow-subtle"
          >
            <h2 className="text-subheading font-semibold">
              Current status is unreachable
            </h2>
            <p className="mt-2 text-body text-muted-foreground">
              {retained
                ? "The facts below are retained and stale; the latest request did not answer."
                : "No current status document could be reached. This is not an operational result."}
            </p>
            <Button className="mt-4" variant="outline" onClick={retry}>
              Retry
            </Button>
          </section>
        ) : null}

        {statusDocument ? (
          <section
            aria-labelledby="overall-status"
            className="flex flex-col gap-5"
          >
            <div>
              <h2
                id="overall-status"
                className="text-caption font-medium tracking-wide text-muted-foreground uppercase"
              >
                Overall
              </h2>
              <p className="mt-1 text-heading-sm font-semibold">
                {sentence(statusDocument.state)}
              </p>
              <p className="mt-1 text-caption text-muted-foreground">
                Generated{" "}
                <time dateTime={statusDocument.generated_at}>
                  {new Date(statusDocument.generated_at).toLocaleString()}
                </time>
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {statusDocument.components.map((component) => (
                <StatusCard
                  key={component.id}
                  component={component}
                  retained={retained}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}
