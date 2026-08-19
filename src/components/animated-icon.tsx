import type { ComponentProps, ComponentType } from "react"

import type { AnimatedIconProps } from "@/components/ui/types"
import { cn } from "@/lib/utils"

type Props = Omit<ComponentProps<"span">, "children"> & {
  /** An itshover icon component from `src/components/ui/`. */
  icon: ComponentType<AnimatedIconProps>
  /**
   * The icon's accessible name. Omit it only when the icon repeats text that is already beside it,
   * which is the common case — then the icon is decorative and is hidden from assistive technology.
   */
  label?: string
  /** Forwarded to the icon. Everything else on this component lands on the wrapper. */
  size?: AnimatedIconProps["size"]
  color?: AnimatedIconProps["color"]
  strokeWidth?: AnimatedIconProps["strokeWidth"]
}

/**
 * The wrapper every itshover icon is rendered through. It exists because the generated icons cannot
 * be given what this repository requires of them.
 *
 * Two facts about that generated source, both checked rather than assumed:
 *
 * 1. The component signature destructures `size`, `color`, `strokeWidth` and `className` and drops
 *    every other prop. `aria-hidden`, `aria-label`, `role` and `data-*` cannot reach the `svg` at
 *    all — which is why this component forwards only those three to the icon and puts everything
 *    else on a wrapper it owns.
 * 2. The animation runs through motion's imperative `animate()` from `useAnimate`. `MotionConfig
 *    reducedMotion="user"` documents that it disables transform animations for `motion` components,
 *    and it does not reach this path — measured in `animated-icon.test.tsx`. The `data-animated-icon`
 *    attribute is what `src/index.css` targets to stop the motion in CSS, which no JavaScript can
 *    route around.
 *
 * The animation is decorative in every case. It fires on hover, so a keyboard user never sees it —
 * acceptable only for as long as it carries no information. Never make an icon's motion the only
 * feedback for an interaction.
 */
export function AnimatedIcon({
  icon: Icon,
  label,
  className,
  size,
  color,
  strokeWidth,
  ...wrapperProps
}: Props) {
  return (
    <span
      data-animated-icon=""
      className={cn("inline-flex shrink-0", className)}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
      {...wrapperProps}
    >
      <Icon size={size} color={color} strokeWidth={strokeWidth} />
    </span>
  )
}
