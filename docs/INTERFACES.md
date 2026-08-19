# Web interfaces

## Edge API boundary

Session establish, refresh, and revoke; capability discovery; search; record and document reads;
collections and tags; capture submit with idempotency; operation status and streaming; GitHub
catalog; Git Vault snapshots and restore verification; sessions, devices, and provider accounts.
All calls use TLS, an allowlisted endpoint, bounded retries, and normalized errors.

## Contract boundary

The Platform API contract is pinned by digest. Types are generated from it and committed. Generation
is its own commit. A mismatch fails the build; no flag bypasses it. Hand-widening or casting around a
generated type is forbidden, because it moves a build failure into a user's session.

## Streaming boundary

Operation progress arrives as a stream. A dropped stream falls back to visible polling. Events may
duplicate and arrive out of order; the client's operation state machine is monotonic regardless.

## Browser boundary

Router and history, storage per the approved ADR, clipboard and file input for explicit user actions,
theme and reduced-motion preferences, and print for the reader view. No service worker, no
background sync, and no third-party host in the first version.

## Deep links

The client accepts deep links emitted by mobile, the extension, and Telegram, and emits its own. A
deep link names a record or an operation, carries no token, and resolves through normal
authentication when the session is absent.

## Rules

The gateway owns tokens, refresh, retry, and error normalization. Views render escaped, sanitized
content and never inject raw HTML from the archive. Errors distinguish offline, unauthenticated,
revoked, forbidden, unsupported, not-found, invalid, partially-succeeded, and terminal, because the
recovery differs for each. No URL, query string, note text, or search text enters telemetry.
