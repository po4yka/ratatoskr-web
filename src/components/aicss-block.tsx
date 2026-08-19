import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

type Props = Omit<ComponentProps<"div">, "children"> & {
  children: ReactNode
  /**
   * Announce this region's changes to assistive technology. Use it for anything that reports what
   * the system is doing — a phase, a progress line, a result — and leave it off for a table or a
   * code block, which are read on demand rather than announced.
   */
  status?: boolean
}

/**
 * The wrapper every vendored AIcss component is rendered through, for the same reason
 * `AnimatedIcon` exists: what arrives from the registry is not what this repository requires, and
 * `src/components/aicss/` is generated so it cannot be fixed in place.
 *
 * Two gaps it closes, both read out of the vendored source rather than assumed:
 *
 * 1. **No reduced-motion handling.** `ThinkingState.module.css` runs
 *    `animation: label-shine 2.25s ... infinite` with no `prefers-reduced-motion` query anywhere.
 *    `data-vendored-motion` is what the backstop in `src/index.css` targets.
 * 2. **No live-region semantics.** The component is a `<span>` reading "Thinking". A screen reader
 *    is never told the system started working, which for a status indicator is the whole point of
 *    it.
 *
 * One caveat that the wrapper cannot fix for you: a live region announces a *change*, not its
 * initial content. Mount `AicssBlock status` while the region is empty or idle and then change what
 * is inside it — mounting it already full announces nothing on most screen readers.
 *
 * Colours are the known gap. These components hard-code hex values (`#a1a1a1`) instead of reading
 * the theme tokens, and their dark-mode block is a copy of the light one. A component adopted for
 * real use should be copied out of `src/components/aicss/` into `src/components/` and have its
 * module CSS rewritten against the tokens — at which point it stops being vendored and starts being
 * ours.
 */
export function AicssBlock({ children, status, className, ...props }: Props) {
  return (
    <div
      data-vendored-motion=""
      className={cn("contents", className)}
      {...(status ? { role: "status" } : {})}
      {...props}
    >
      {children}
    </div>
  )
}
