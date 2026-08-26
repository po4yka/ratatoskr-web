import { useCallback, useEffect, useState } from "react"
import {
  applyOptimistic,
  type CurationCommand,
  type CurationSnapshot,
  type CurationSource,
} from "@/features/collections/curation-source"

export interface CurationState {
  readonly error: string | null
  readonly mutate: (
    command: CurationCommand
  ) => Promise<CurationSnapshot | null>
  readonly retry: () => void
  readonly snapshot: CurationSnapshot | null
}

export function useCuration(source: CurationSource): CurationState {
  const [snapshot, setSnapshot] = useState<CurationSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    source
      .read()
      .then((next) => active && setSnapshot(next))
      .catch(() => active && setError("Collections could not load."))
    return () => {
      active = false
    }
  }, [attempt, source])

  const mutate = useCallback(
    async (command: CurationCommand) => {
      if (!snapshot) return null
      const previous = snapshot
      setError(null)
      setSnapshot(applyOptimistic(previous, command))
      try {
        const next = await source.mutate(command)
        setSnapshot(next)
        return next
      } catch {
        setSnapshot(previous)
        setError(
          "The fixture mutation was rejected. Your previous view was restored."
        )
        return null
      }
    },
    [snapshot, source]
  )

  function retry() {
    setError(null)
    setSnapshot(null)
    setAttempt((value) => value + 1)
  }

  return { error, mutate, retry, snapshot }
}
