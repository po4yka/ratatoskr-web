import { MotionConfig } from "motion/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ErrorBoundary } from "@/app/error-boundary.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/*
      `reducedMotion="user"` disables transform and layout animations for the `motion` components we
      write. It does NOT cover the imperative `animate()` the generated itshover icons use; the CSS
      block in `index.css` is what covers those. Both are needed and neither replaces the other.
    */}
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ErrorBoundary region="app">
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>
)
