import { useEffect, useState } from "react"
import { describeNotesFailure } from "./notes-source"

/** A read that is loading, failed with a user-safe message, or holds a value. */
export type Read<T> =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "ready"; readonly value: T }

/**
 * Run one read when the component mounts. The caller keeps `load` stable and
 * keys the component by what it reads, so a new target is a new mount.
 */
export function useRead<T>(load: () => Promise<T>, fallback: string): Read<T> {
  const [read, setRead] = useState<Read<T>>({ kind: "loading" })
  useEffect(() => {
    let alive = true
    load().then(
      (value) => {
        if (alive) setRead({ kind: "ready", value })
      },
      (failure: unknown) => {
        if (alive)
          setRead({
            kind: "failed",
            message: describeNotesFailure(failure, fallback),
          })
      }
    )
    return () => {
      alive = false
    }
  }, [load, fallback])
  return read
}

/** The browse address of one file of the current connection. */
export function fileLink(path: string): string {
  return `?file=${encodeURIComponent(path)}`
}
