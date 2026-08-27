import type { MouseEvent } from "react"

/** Make the native skip-link destination an explicit focus target. */
export function focusMainLandmark(
  event: MouseEvent<HTMLAnchorElement>,
  mainId = "main"
) {
  const main = document.getElementById(mainId)
  if (main === null) return
  event.preventDefault()
  window.history.replaceState(null, "", `#${mainId}`)
  main.focus()
}
