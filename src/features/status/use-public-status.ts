import { useCallback, useEffect, useMemo, useState } from "react"
import { useGateway } from "@/api/gateway/context"
import {
  createStatusSource,
  type PublicStatusDocument,
} from "@/features/status/status-source"

type LoadState = "loading" | "ready" | "failed"

export function usePublicStatus() {
  const gateway = useGateway()
  const source = useMemo(() => createStatusSource(gateway), [gateway])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [statusDocument, setStatusDocument] =
    useState<PublicStatusDocument | null>(null)
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    if (statusDocument === null) setLoadState("loading")
    setAttempt((value) => value + 1)
  }, [statusDocument])

  useEffect(() => {
    const controller = new AbortController()
    source.read(controller.signal).then(
      (next) => {
        setStatusDocument(next)
        setLoadState("ready")
      },
      () => setLoadState("failed")
    )
    return () => controller.abort()
  }, [attempt, source])

  return { loadState, retry, statusDocument }
}
