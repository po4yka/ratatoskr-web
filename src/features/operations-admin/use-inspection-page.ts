import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import type { ApiError } from "@/api/gateway/errors"

type PageState<T> =
  | { kind: "loading" }
  | { kind: "ready"; page: T }
  | { kind: "failed"; failure: ApiError }

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    typeof value.kind === "string"
  )
}

export function useInspectionPage<T>(
  read: (cursor: string | null, signal: AbortSignal) => Promise<T>
) {
  const [search, setSearch] = useSearchParams()
  const cursor = search.get("cursor")
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${cursor ?? ""}\u0000${attempt}`
  const [settled, setSettled] = useState<{
    key: string
    state: PageState<T>
  }>({ key: requestKey, state: { kind: "loading" } })
  const state: PageState<T> =
    settled.key === requestKey ? settled.state : { kind: "loading" }

  useEffect(() => {
    const controller = new AbortController()
    read(cursor, controller.signal).then(
      (page) => setSettled({ key: requestKey, state: { kind: "ready", page } }),
      (failure: unknown) => {
        if (!controller.signal.aborted)
          setSettled({
            key: requestKey,
            state: {
              kind: "failed",
              failure: isApiError(failure)
                ? failure
                : { kind: "terminal", status: 0 },
            },
          })
      }
    )
    return () => controller.abort()
  }, [cursor, read, requestKey])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  const next = useCallback(
    (nextCursor: string) => setSearch({ cursor: nextCursor }),
    [setSearch]
  )
  return { next, retry, state }
}
