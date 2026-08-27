const prefix = "ratatoskr.capture.intent.v1."

export function rememberCapture(operationId: string, url: string): void {
  try {
    sessionStorage.setItem(`${prefix}${operationId}`, url)
  } catch {
    // An accepted server operation remains valid when browser storage is denied.
  }
}

export function captureUrlFor(operationId: string): string | null {
  try {
    return sessionStorage.getItem(`${prefix}${operationId}`)
  } catch {
    return null
  }
}
