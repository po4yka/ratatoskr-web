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
    // Vendored source. Every directory here is written by a generator — `shadcn add` for `ui` and
    // `canvasui`, `npm run ui:add:aicss` for `aicss` — and re-running it overwrites whatever was
    // edited. A lint fix applied inside these files is therefore a fix that comes back, with the
    // commit that made it gone. See `src/components/ui/NOTICE.md` for what is vendored and under
    // which licence.
    //
    // The two rules disabled here are the ones this vendored code actually trips:
    // `only-export-components` because shadcn components export a `cva` variants object beside the
    // component and Canvas UI exports its imperative factory beside its wrapper; `no-empty` because
    // Canvas UI swallows a WebGL error with a bare `catch {}`. Both stay on everywhere a person
    // writes code.
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/components/canvasui/**/*.{ts,tsx}",
      "src/components/aicss/**/*.{ts,tsx}",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
      "no-empty": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.setup.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
])
