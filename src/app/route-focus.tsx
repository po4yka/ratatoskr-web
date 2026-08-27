import { useEffect } from "react"
import { useLocation } from "react-router"

function focusHeading(mainId: string): boolean {
  const heading = document.querySelector<HTMLElement>(`#${mainId} h1`)
  if (heading === null) return false
  heading.tabIndex = -1
  heading.focus()
  return true
}

/** Focus the next route heading once its lazy content has committed. */
export function RouteFocusManager({ mainId = "main" }: { mainId?: string }) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (focusHeading(mainId)) return undefined
    function stopWaiting() {
      observer.disconnect()
      document.removeEventListener("pointerdown", stopWaiting, true)
      document.removeEventListener("keydown", stopWaiting, true)
    }
    const observer = new MutationObserver(() => {
      if (focusHeading(mainId)) stopWaiting()
    })
    observer.observe(document.getElementById(mainId) ?? document.body, {
      childList: true,
      subtree: true,
    })
    document.addEventListener("pointerdown", stopWaiting, true)
    document.addEventListener("keydown", stopWaiting, true)
    return stopWaiting
  }, [mainId, pathname])

  return null
}
