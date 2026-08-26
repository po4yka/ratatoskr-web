const progressPrefix = "ratatoskr.reader.progress.v1."

export interface ScrollGeometry {
  scrollHeight: number
  clientHeight: number
}

function scrollableDistance({
  scrollHeight,
  clientHeight,
}: ScrollGeometry): number {
  return Math.max(0, scrollHeight - clientHeight)
}

export function progressForScroll(
  scrollTop: number,
  geometry: ScrollGeometry
): number {
  const distance = scrollableDistance(geometry)
  if (!distance) return 0
  return Math.min(1, Math.max(0, scrollTop / distance))
}

export function resumeScrollTop(
  progress: number,
  geometry: ScrollGeometry
): number {
  const ratio = Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : 0
  return ratio * scrollableDistance(geometry)
}

export function readProgress(documentId: string): number | null {
  try {
    const value = Number(localStorage.getItem(`${progressPrefix}${documentId}`))
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : null
  } catch {
    return null
  }
}

export function writeProgress(documentId: string, progress: number): void {
  const ratio = Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : 0
  localStorage.setItem(`${progressPrefix}${documentId}`, String(ratio))
}
