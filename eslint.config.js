import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // `src/components/ui` is written by `shadcn add`, not by hand. Its components export a `cva`
    // variants object beside the component, which `react-refresh/only-export-components` rejects —
    // shadcn's own generated button fails shadcn's own generated config on a clean install.
    //
    // The rule is off for this directory rather than fixed in the files, because a fix there is
    // overwritten by the next `shadcn add` of the same component and the error returns with nothing
    // to show for the edit. The rule stays on everywhere a person actually writes a component.
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.setup.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
])
