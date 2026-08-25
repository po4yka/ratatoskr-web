## 1. Custody and provider core

- [x] 1.1 RED: add `src/auth/custody.test.ts` with test "stores, reads, and completely discards one credential" — assert `readCustody()` returns the stored value after `store()` and `null` after `discard()`; run it and confirm it fails because `src/auth/custody.ts` does not exist.
- [x] 1.2 GREEN: implement `src/auth/custody.ts` (sessionStorage-backed store/read/discard under one key) until 1.1 passes.
- [x] 1.3 RED: add `src/auth/provider.test.ts` with tests for the presented-credential mode over an injected gateway double: "probe maps success to authenticated", "probe maps refused and revoked answers to unauthenticated", "probe maps offline to unreachable", "signIn probes before taking custody and refuses without storing" — confirm they fail because the provider module does not exist.
- [x] 1.4 GREEN: implement `src/auth/provider.ts` (provider interface plus presented-credential mode whose refresh reports rejected and revoke clears custody) until 1.3 passes.

## 2. Boot decision matrix

- [x] 2.1 RED: add `src/auth/boot.test.ts` covering the matrix in one resolver: "valid custody resolves authenticated", "refused credential resolves unauthenticated and discards custody", "no stored custody resolves unauthenticated without sending a request", "offline probe resolves unreachable" — confirm each fails because the boot module does not exist.
- [x] 2.2 GREEN: implement `src/auth/boot.ts` (promise-based resolver returning authenticated | unauthenticated | unreachable) until 2.1 passes.

## 3. Gateway wiring

- [x] 3.1 RED: add `src/auth/session-gateway.test.ts` with test "a mid-use refusal ends the session through the revocation callback and clears custody" — build the wired gateway from the session composition module over fetch doubles answering 401 then asserting the callback fired and custody is null; confirm it fails because no wiring exists.
- [x] 3.2 GREEN: implement `src/auth/session-gateway.ts` composing token source from custody, refresher from the provider, and the revocation callback into `createGateway`, until 3.1 passes.

## 4. React integration

- [x] 4.1 RED: add `src/auth/auth-context.test.tsx`: "renders the designed pending state while boot is unresolved", "renders the shell when boot resolves authenticated", "renders the unauthorized surface when boot resolves unauthenticated", "renders a boot-failure state with a working retry when the backend is unreachable" — confirm failures because the context does not exist.
- [x] 4.2 GREEN: implement `src/auth/auth-context.tsx` mounting the boot resolver behind one context exposing status, retry, signIn, signOut; render outcomes through the router; migrate the existing App test.
- [x] 4.3 RED: add `src/features/login/login-page.test.tsx`: "a usable credential signs the user in", "an unusable credential shows refusal without taking custody", "an unreachable backend renders a distinct retryable failure" — confirm failure because the page does not exist.
- [x] 4.4 GREEN: implement `src/features/login/` functional form until 4.3 passes.
- [x] 4.5 RED: add `src/components/shell/shell.test.tsx` for deep-link return: "opening /collections while signed out offers sign-in and lands on /collections after signing in" — confirm it fails because the shell does not gate routes yet.
- [x] 4.6 GREEN: implement the protected route wrapper capturing location state and returning the user to the requested URL after sign-in, until 4.5 passes.

## 5. Shell surface

- [x] 5.1 Add generated shadcn components via `npm run ui:add -- dropdown-menu input` (generated files; no failing test applies).
- [x] 5.2 RED: add `src/components/shell/shell.test.tsx` structural tests: "shell exposes a skip link that targets the main region", "navigation skeleton carries landmark roles", "theme switcher offers light, dark, and system and persists the choice", "user menu reaches sign-out by keyboard with visible focus" — confirm failures against the missing shell markup.
- [x] 5.3 GREEN: implement `src/components/shell/` (nav skeleton, theme switcher, user menu) until 5.2 passes.
- [x] 5.4 RED: add `src/components/shell/lazy-route.test.tsx` with tests "a cold entry into a feature route shows its pending state while its module arrives, then its view" and "navigating between feature routes holds the previous view until the next one is ready, never blanking the page" — confirmed failing against statically imported routes.
- [x] 5.5 GREEN: convert feature routes to lazy route modules with designed pending states until 5.4 passes.
- [x] 5.6 RED: add `src/features/signout/sign-out.test.tsx` with tests "sign-out invokes the provider revoke exactly once, discards custody, and lands on the unauthorized surface" and "the confirmation says the session ends on this device and never claims server-side revocation" — both passed immediately on first run because the flow landed with the shell surface work; they are kept as the regression pin for that behavior rather than claimed as red-green drivers.
- [x] 5.7 GREEN: wire the sign-out flow and truthful confirmation copy until 5.6 passes.

## 6. Documentation and ADR

- [ ] 6.1 Write `docs/adr/0006-credential-custody.md` recording the sessionStorage decision, rejected alternatives, residual XSS risk, and the revisit trigger (documentation; no failing test applies).
- [ ] 6.2 Update `README.md` authentication section and `docs/ARCHITECTURE.md` section 11 pointers to match shipped reality (documentation; no failing test applies).

## 7. Gate

- [ ] 7.1 Run the full DEVELOPMENT.md command list — api:check, typecheck, lint, format:check, test, build, audit:ui --fail-under 69 — and confirm green.
- [ ] 7.2 Run `openspec validate --change add-session-boot --strict` and confirm the change validates; archive only after every task above is ticked.
