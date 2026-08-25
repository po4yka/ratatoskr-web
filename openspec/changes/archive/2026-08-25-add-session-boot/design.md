## Context

The gateway (item 3) already owns token attach, single-flight refresh coordination, bounded retry, and normalized errors, and exposes three injection points this change consumes: `TokenSource`, the `CredentialRefresher` strategy, and `onSessionRevoked`. The pinned contract authenticates every `/v1` route by bearer credential, mints sessions only via Telegram assertion, and defines no credentials-login, refresh, or revocation endpoint. `GET /v1/capabilities` is authenticated and returns the caller's capability set. No router existed before this change; `react-router` v8 landed in its own commit. ADR-0001..0005 do not decide credential storage, so this change must.

## Goals / Non-Goals

Goals: one provider interface over session operations with pluggable modes; boot resolves before routes render with designed states; custody rules written down in an ADR; shell with lazy routes; truthful sign-in and sign-out against today's contract.

Non-Goals: capability-driven navigation gating (item 5), sessions/devices settings views (item 11), TanStack Query integration, streaming, Mini App embedding, login page visual polish.

## Decisions

### D1: One probe endpoint doubles as the validity check

Boot probes `GET /v1/capabilities` through the gateway. It is authenticated on Platform ("authenticated like every other /v1 route"), so success proves the session, a 401/revoked answer proves it ended, and an offline error distinguishes an unreachable deployment from a dead credential. Alternatives: a dedicated whoami endpoint (does not exist in the contract), probing with an arbitrary feature call (couples boot to a feature). The capabilities payload boot reads is also exactly what item 5 needs next, so the same request later feeds both.

### D2: Auth provider abstraction with modes behind one interface

`src/auth/provider.ts` defines the interface: `probe()`, `signIn(input)`, `refresh()`, `revoke()`. Modes implement it; this change ships the `presented-credential` mode (the user pastes an existing Platform bearer; the mode probes it before custody) as the only wired mode. The future `telegram-assertion` mode implements `signIn(assertion)` against `POST /v1/sessions/telegram` without touching callers; a username/password mode arrives when Platform grows the endpoint. Boot, sign-out, and the shell depend on the interface only. Alternative considered: hard-coding one flow into the boot controller — rejected because the task explicitly requires the seam and Platform's minting story is still moving.

### D3: Credential custody in sessionStorage, argued in ADR-0006

The bearer is held in `sessionStorage` under one key. Rationale: memory-only custody breaks reload-resume, which the spec requires; `localStorage` persists beyond the tab lifetime for no benefit in a self-hosted single-user deployment; httpOnly cookies need a Platform-set cookie that this contract version cannot mint. XSS remains the residual risk and the ADR records it with the mitigations this repo already carries (no third-party scripts, CSP pending its planned slice). Custody is one module (`src/auth/custody.ts`) so revisiting the decision means editing one file plus the ADR, not the store. Alternative: in-memory + silent re-probe — impossible, there is nothing to re-probe with once memory clears.

### D4: Refresh strategy reports the truth of this contract version

The gateway refresher hook gets the provider's `refresh()`: this contract version has no refresh mechanism, so the mode returns `{ status: "rejected" }`, which fires `onSessionRevoked` → custody discarded → client resolves to unauthenticated. That is honest: a mid-use 401 here really is the end of the session, not a token rotation opportunity. When Platform grows a refresh endpoint, only the mode's `refresh()` body changes; the coordinator's single-flight queue already exists and is exercised by tests with injected doubles. Alternative: leaving refresher null so 401 surfaces raw — loses the revocation event the UI must react to.

### D5: Boot state machine lives outside React

`src/auth/boot.ts` holds a small promise-based resolver returning a discriminated outcome (`authenticated | unauthenticated | unreachable`), unit-testable without rendering. React mounts it through one `AuthProvider` context exposing `{ status, retry, signIn, signOut }`. The router renders only after resolution; while pending it renders the designed boot state. Route protection is a shell-level gate rather than per-route guards, matching ARCHITECTURE.md section 8: the shell owns the boot gate.

### D6: Router shape and code splitting

`createBrowserRouter` with a root route that renders either the unauthorized surface or the protected shell based on auth status. Feature routes are stubs (search placeholder etc.) loaded via `lazy: () => import(...)`, each owning its pending state; `/login` renders outside the shell. Deep-link return uses router location state captured at the redirect. Alternative: manual history handling — rejected; the data router gives lazy modules, pending states, and location capture out of the box.

### D7: Sign-out labels what actually happened

`signOut()` calls `provider.revoke()` once, then discards custody and navigates to `/login`. With no revocation endpoint in this version, the confirmation dialog says "ends the session on this device" and never claims server-side revocation; the wording is centralized beside the provider so adding the real revoke later changes behavior without changing claims elsewhere.

## Risks / Trade-offs

- [sessionStorage is readable by any successful XSS] → No third-party code policy already holds; CSP lands with the first served page slice; ADR-0006 records the residual risk and the revisit trigger (refresh-cookie landing).
- [A pasted credential can be mistyped into custody] → Sign-in probes before custody, so unusable credentials never persist; refusal and network failure render differently.
- [Boot adds a serial round-trip before first paint] → One GET, retried by the gateway's existing bounded policy only when idempotent-safe; boot state is designed rather than blank.
- [Router adoption touches main.tsx and App.tsx] → Both are two-screen files today; the diff stays small and the existing App test migrates with them.

## Migration Plan

No data, no backend rollout: client-only. Commits land in order — dependency (done), tests+implementation per task pair, docs. Rollback is reverting the branch; nothing outside the repository changes.

## Open Questions

None. The contract-gap question was resolved by the repository owner: build contract-faithfully now and flag the missing endpoints as a workspace changeset prerequisite (credentials mint, session revoke, refresh), drafted in parallel on the Platform side.
