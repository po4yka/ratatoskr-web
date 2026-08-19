import { Component, type ErrorInfo, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

type Props = {
  children: ReactNode
  /** Names the region this boundary protects, so a caught error says where it happened. */
  region?: string
}

type State = { error: Error | null }

/**
 * The boundary `docs/ARCHITECTURE.md` section 8 describes: a render failure degrades one region
 * rather than blanking the application.
 *
 * React only routes render, lifecycle, and constructor errors here. An event handler, a promise
 * rejection, and anything inside `setTimeout` reach `window.onerror` instead — those belong to the
 * gateway's error normalization, not to this file.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The message and the component stack, never the props. A caught error in this client is one
    // render away from an archive record, and SECURITY.md keeps user content out of anything that
    // leaves the tab.
    console.error(
      `[${this.props.region ?? "app"}] render failed: ${error.message}`,
      info.componentStack
    )
  }

  /** Clears the caught error so the subtree re-renders. Named, because an inline `setState` is
   *  a retry that neither a reader nor a static analyser can find. */
  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 p-6 text-sm"
        data-region={this.props.region}
      >
        <p className="font-medium">This part of the page failed to render.</p>
        <p className="max-w-prose text-muted-foreground">
          The rest of the application is still working. Retrying re-renders this
          region; if it fails again, reload the page.
        </p>
        <Button variant="outline" size="sm" onClick={this.reset}>
          Retry
        </Button>
      </div>
    )
  }
}
