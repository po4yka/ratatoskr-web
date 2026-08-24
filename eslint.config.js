import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores(["dist", "coverage", "src/api/generated"]),
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
    // Size limits. Every number is the worst case measured in hand-written code on the day it was
    // written, so the check fails on a regression and not on work that has not been done yet — the
    // same ratchet the `shadscan --fail-under` number in `ci.yml` is. `npm run lint` is a bare
    // `eslint .` with no `--max-warnings`, and that command exits 0 on a warning, so a size rule set
    // to `warn` would be a gate that never closes. These are errors or they are nothing.
    //
    // Blank lines and comments do not count. The configuration and the components here explain why a
    // value is what it is, and a limit that counts prose would tax the practice that makes this tree
    // readable.
    //
    // The exception is taken at the site that needs it, as `// eslint-disable-next-line <rule> --
    // <reason>`, and never by raising a number here. A raised number applies to code nobody has
    // written yet.
    rules: {
      // Worst authored file: 184 code lines, src/components/theme-provider.tsx. ESLint's own default
      // is 300, which nothing here could reach.
      "max-lines": [
        "error",
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      // Worst authored function: 115 code lines, ThemeProvider. It is long for a real reason — one
      // provider holding a media-query listener, a keydown handler, a storage listener and a memo —
      // and not because of JSX: its return is five lines. ESLint's default of 50 would fail this tree
      // today. Split that provider into hooks and lower this number in the same commit.
      "max-lines-per-function": [
        "error",
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
      // Worst authored function: 7, the keydown handler in theme-provider.tsx. McCabe's conventional
      // number is 10 and ESLint's default is 20; 8 is where this tree actually sits. JSX contributes
      // almost nothing to this score, but a ternary inside JSX does.
      complexity: ["error", 8],
      // Worst authored signature: 2, `componentDidCatch` in src/app/error-boundary.tsx, which React
      // defines and this repository cannot change. Every other function here takes one argument or
      // none. A destructured props object counts as one, so this never constrains a component; it
      // constrains a helper, which is where it is wanted.
      "max-params": ["error", 2],
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
    //
    // The four size limits are off here for the same reason with more force. Canvas UI's `Ripple.tsx`
    // is 550 code lines and its `createRipple` is 317, so leaving them on would fail the build on
    // five findings, every one of them in a file the next `npm run ui:add:aicss` rewrites. A size
    // finding also cannot be answered with a one-line edit the way `no-empty` could: the answer is a
    // refactor, and the refactor is what the generator undoes. Setting the standard for hand-written
    // code at the shape of a generated WebGL harness is the other way this ends, and it is worse.
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/components/canvasui/**/*.{ts,tsx}",
      "src/components/aicss/**/*.{ts,tsx}",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
      "no-empty": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      complexity: "off",
      "max-params": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.setup.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
])
