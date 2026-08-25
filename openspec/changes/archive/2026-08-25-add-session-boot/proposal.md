## Why

The gateway exists but nothing establishes who is using the client. Every future view assumes a session, and ARCHITECTURE.md section 11 requires boot to resolve authenticated or unauthenticated before any shell renders, sign-out to revoke server-side, and an unauthorized state that offers a path forward rather than a dead error. This is plan item 4 in `docs/IMPLEMENTATION_PLAN.md` and the first consumer of the gateway.

The pinned contract constrains what this version can do against a live Platform. It mints sessions only through `POST /v1/sessions/telegram`, returns the bearer credential exactly once with `expires_at`, and defines no credentials-login, refresh, or revocation endpoint. `GET /v1/capabilities` is authenticated like every `/v1` route, which makes it a truthful session-validity probe. Per the repository owner's decision, this change builds the full session machinery contract-faithfully now, and the missing Platform endpoints are flagged as a workspace changeset prerequisite rather than invented client-side with hand-written request or response shapes.

## What Changes

- Add an auth provider abstraction under `src/auth/`: one interface over probe, sign-in, refresh, and revoke, with modes behind it so a Telegram-assertion mode can plug in later without rework.
- Add session boot: before app routes render, probe session validity through the gateway and resolve to authenticated, unauthenticated, backend-unreachable, or boot-failed. No view flashes while the decision is pending.
- Wire the gateway to the session store: the token source reads the live credential, the single-flight refresh coordinator gets its strategy from the provider, and a confirmed revocation drives the client back to unauthenticated.
- Add credential custody per a new storage ADR, since none of ADR-0001..0005 decides it.
- Add sign-in for the one mode the contract supports today: presenting an existing Platform credential, probed via the authenticated capabilities read before custody is taken. Username/password and Telegram-assertion exchange stay interface-only until Platform grows their endpoints.
- Add sign-out through the provider's revoke operation; until Platform exposes a revocation endpoint the client clears custody truthfully and labels the act accordingly, never claiming a server-side revoke it did not perform.
- Add the protected shell: navigation skeleton, theme switcher (light/dark/system), user menu, skip link, and route-level code splitting via lazily loaded routes.
- Add `/login` as the explicit unauthenticated surface with a functional sign-in form, plus designed loading, error, and boot-failure states for the boot sequence.
- Add `react-router` (own commit, already landed) as the router.

Out of scope: login page design polish beyond the functional form, Mini App embedding, capability-driven navigation gating (item 5), sessions/devices settings views (item 11), streaming.

## Capabilities

### New Capabilities

- `session-auth`: The client resolves who is using it before rendering app routes — probing session validity through the gateway, holding the credential per the approved storage decision, signing in with a credential Platform accepts, signing out through one provider interface, and rendering an explicit unauthorized state with a path forward.

### Modified Capabilities

None. The api-gateway capability's requirements do not change; this change consumes its injection points (token source, refresher, revocation callback) as built.

## Impact

- New code: `src/auth/` (session store, provider abstraction, boot controller) and `src/components/shell/`; rewrites of `src/App.tsx` and `src/main.tsx` to mount the router and boot gate. Generated files untouched.
- Dependencies: `react-router` added in its own commit. Two generated shadcn components (`dropdown-menu`, `input`) join `src/components/ui/` through the CLI.
- Contract: no regeneration; every wire call maps to an existing pinned path. Missing endpoints (credentials mint, session revoke, refresh) are recorded as the workspace-changeset prerequisite this change depends on for its later modes.
- Gate: unchanged command list; new modules must hold the size limits in `eslint.config.js`.
