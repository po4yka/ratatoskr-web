import { defineConfig, mergeConfig } from "vite"
import baseConfig from "../vite.config.ts"

const theme = process.env.SHADSCAN_THEME === "dark" ? "dark" : "light"

/**
 * Rendered-audit-only bootstrap. The credential is the bounded mock Platform
 * fixture, never a deployment secret, and this transform is not used by the
 * production build.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      {
        name: "shadscan-owner-fixture",
        transformIndexHtml: {
          order: "pre",
          handler: () => [
            {
              tag: "script",
              injectTo: "head-prepend",
              children: `sessionStorage.setItem("ratatoskr.session.credential", "owner-credential");localStorage.setItem("theme", ${JSON.stringify(theme)});`,
            },
          ],
        },
      },
    ],
  })
)
