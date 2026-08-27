import type { ApiError } from "@/api/gateway/errors"
import { Button } from "@/components/ui/button"

export function InspectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
        Owner operations
      </p>
      <h1 className="text-heading font-semibold">{title}</h1>
      <p className="max-w-2xl text-body text-muted-foreground">{description}</p>
    </header>
  )
}

export function InspectionPending({ label }: { label: string }) {
  return (
    <p role="status" className="text-body text-muted-foreground">
      Loading {label}…
    </p>
  )
}

export function InspectionFailure({
  failure,
  retry,
}: {
  failure: ApiError
  retry: () => void
}) {
  if (failure.kind === "forbidden") {
    return (
      <section>
        <h1 className="text-heading-sm font-semibold">
          Owner access is required
        </h1>
        <p className="text-body text-muted-foreground">
          Platform refused this live read. A previously visible link is not
          authorization.
        </p>
      </section>
    )
  }
  return (
    <section
      role="alert"
      className="rounded-xl border border-border bg-card p-5"
    >
      <h2 className="text-subheading font-semibold">
        {failure.kind === "offline"
          ? "Platform is offline"
          : "Operational data could not be read"}
      </h2>
      <p className="mt-2 text-body text-muted-foreground">
        No result is shown for this failed request.
      </p>
      <Button className="mt-4" variant="outline" onClick={retry}>
        Retry
      </Button>
    </section>
  )
}

export function NextPage({
  cursor,
  next,
}: {
  cursor?: string | null
  next: (cursor: string) => void
}) {
  return cursor ? (
    <Button variant="outline" onClick={() => next(cursor)}>
      Next page
    </Button>
  ) : null
}

export function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="text-body break-words">{children}</dd>
    </div>
  )
}
