import { useCallback, useEffect, useMemo, useState } from "react"
import { useGateway } from "@/api/gateway/context"
import { useIdempotencyKey } from "@/features/notes/use-idempotency-key"
import { BuildProgress } from "./build-progress"
import { BuildRequest } from "./build-request"
import {
  describeBuildFailure,
  releasesSource,
  type FailedBuild,
  type ReleaseHistory as History,
  type SiteRelease,
} from "./releases-source"
import { describeSitesFailure } from "./sites-source"

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "ready"; readonly history: History }

function pages(count: number): string {
  return count === 1 ? "1 page" : `${count} pages`
}

function ReleaseItem({
  release,
  current,
}: {
  readonly release: SiteRelease
  readonly current: boolean
}) {
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-border p-3">
      {current ? (
        <p className="text-body font-semibold">Current release</p>
      ) : null}
      <p className="font-mono text-body break-all">{release.release_id}</p>
      <p className="text-body text-muted-foreground">
        <time dateTime={release.built_at}>
          {new Date(release.built_at).toLocaleString()}
        </time>{" "}
        · <span>{pages(release.page_count)}</span>
      </p>
    </li>
  )
}

function FailureItem({ build }: { readonly build: FailedBuild }) {
  const sentence = describeBuildFailure(build.code)
  return (
    <li className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <p className="text-body text-muted-foreground">
        <time dateTime={build.failed_at}>
          {new Date(build.failed_at).toLocaleString()}
        </time>{" "}
        · <span className="font-mono">{build.code}</span>
      </p>
      {sentence === null ? null : (
        <p className="text-body text-destructive">{sentence}</p>
      )}
      {build.message === undefined ? null : (
        <p className="text-body">{build.message}</p>
      )}
    </li>
  )
}

function HistoryLists({ history }: { readonly history: History }) {
  return (
    <>
      {history.releases.length === 0 ? (
        <p className="text-body">
          This site has no release. The first release is built only when you
          request it.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {history.releases.map((release) => (
            <ReleaseItem
              current={release.release_id === history.current_release_id}
              key={release.release_id}
              release={release}
            />
          ))}
        </ul>
      )}
      {history.failed_builds.length === 0 ? null : (
        <>
          <h3 className="text-body font-semibold">Failed builds</h3>
          <ul className="flex flex-col gap-2">
            {history.failed_builds.map((build) => (
              <FailureItem build={build} key={build.operation_id} />
            ))}
          </ul>
        </>
      )}
    </>
  )
}

/** The releases of a site, its failed builds and the build request. */
export function ReleaseHistory({
  siteId,
  approved,
}: {
  readonly siteId: string
  readonly approved: boolean
}) {
  const gateway = useGateway()
  const source = useMemo(() => releasesSource(gateway), [gateway])
  const idempotency = useIdempotencyKey()
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" })
  const [operationId, setOperationId] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const reload = useCallback(() => {
    source.history(siteId).then(
      (history) => setLoaded({ kind: "ready", history }),
      (failure: unknown) =>
        setLoaded({
          kind: "failed",
          message: describeSitesFailure(
            failure,
            "The releases could not load."
          ),
        })
    )
  }, [source, siteId])
  useEffect(reload, [reload])

  async function build() {
    setProblem(null)
    try {
      const key = idempotency.keyFor(siteId)
      const accepted = await source.build({ siteId, key })
      idempotency.accepted()
      setOperationId(accepted.operation_id)
    } catch (failure) {
      setProblem(describeSitesFailure(failure, "The build was not requested."))
    }
  }

  return (
    <section
      aria-labelledby="site-releases-heading"
      className="flex flex-col gap-4"
    >
      <h2 className="text-heading-sm font-semibold" id="site-releases-heading">
        Releases
      </h2>
      {loaded.kind === "loading" ? (
        <p role="status">Loading the releases</p>
      ) : null}
      {loaded.kind === "failed" ? (
        <p className="text-body text-destructive" role="alert">
          {loaded.message}
        </p>
      ) : null}
      {loaded.kind === "ready" ? (
        <>
          <HistoryLists history={loaded.history} />
          <BuildRequest
            approved={approved}
            first={loaded.history.releases.length === 0}
            onBuild={() => void build()}
          />
        </>
      ) : null}
      {problem === null ? null : (
        <p className="text-body text-destructive" role="alert">
          {problem}
        </p>
      )}
      {operationId === null ? null : (
        <BuildProgress
          key={operationId}
          onEnded={reload}
          operationId={operationId}
        />
      )}
    </section>
  )
}
