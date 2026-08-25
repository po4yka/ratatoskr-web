# ADR-0006: Credential custody in sessionStorage

> Status: Accepted  
> Date: 2026-08-25

## Context

Session boot (plan item 4) made the client hold a bearer credential for the first time, and no earlier decision says where it lives. The pinned contract mints sessions once — `POST /v1/sessions/telegram` returns the credential exactly once with an `expires_at` — and defines no refresh endpoint, so whatever the browser holds must survive long enough to be useful across a reload, because there is nothing to silently renew it from.

Repository rules already fix two boundaries: storage follows an approved ADR rather than being changed in passing, and provider tokens never reach the browser at all (this decision concerns only the user's own Platform session credential).

## Options

**Memory only.** The credential dies with the JavaScript context. Every reload is a signed-out reload; boot would resolve unauthenticated and demand a fresh credential each time. For a reading client this is disqualifying on its own, and there is no refresh mechanism that could soften it.

**httpOnly cookie.** The strongest option against script theft, and the shape the legacy gateway's refresh design pointed at — but setting an httpOnly cookie is something Platform does, not something the client can choose. This contract version has no such endpoint or cookie contract, so choosing it today would mean inventing server behavior. Rejected for now; recorded as the revisit trigger below.

**localStorage.** Survives reloads, but also outlives the tab deliberately. In a self-hosted single-user deployment there is no convenience gain worth extending the window in which stolen bytes remain usable beyond the session they belong to.

**sessionStorage — chosen.** Survives reloads within the tab's life, which is exactly the guarantee boot needs; cleared when the tab closes, so custody never outlives the browsing session that produced it.

## Decision

The presented Platform credential is held in `sessionStorage` under one key (`ratatoskr.session.credential`), written once by the auth provider after Platform accepts it, read per request through the gateway's token source, and discarded completely on sign-out, on a confirmed revocation, or when Platform refuses it during a boot probe. All of that is one module, `src/auth/custody.ts`; revisiting this decision means editing that file and this ADR, not the store, the provider, or the shell.

## Risks / Trade-offs

- [Any successful XSS can read the credential] → The repository already bans third-party scripts, fonts, analytics, and tag managers; CSP lands with the first served page slice and will harden this further. Residual risk accepted for the development phase.
- [A credential outliving its `expires_at` can sit in storage until the next probe refuses it] → Boot probes before trusting custody and discards on refusal, so stale bytes cost one request, not a session.
- [Two tabs do not share custody] → Each tab signs in independently. Accepted; a household deployment has one operator, and sharing custody across tabs would also share sign-out ambiguously.

## Consequences

- Reload keeps the user signed in until Platform says otherwise, without any renewal mechanism.
- Tab close ends custody; the next visit starts from the unauthorized surface.
- When Platform grows a refresh-cookie contract, custody moves behind it in one commit touching `custody.ts` and this ADR — that is the revisit trigger, and it should be taken then rather than argued again from scratch.

## Security and privacy impact

The credential is user content adjacent but is never logged, never sent anywhere except the Edge API over its own authenticated requests, and never enters telemetry or diagnostics exports. Discard paths run on sign-out and refusal; nothing writes the credential outside the single storage key.

## Accessibility impact

No direct surface. Indirectly, reload-resume means keyboard users are not asked to re-enter a credential after an accidental reload mid-task.

## Validation

`src/auth/custody.test.ts` proves store/read/discard round-trip; the provider tests prove custody moves only after acceptance and disappears on revocation; the boot tests prove refused custody is discarded; the sign-out test proves the discard happens through the flow a user actually drives.
