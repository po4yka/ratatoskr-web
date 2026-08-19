# Web threat model

## Assets

Session and refresh tokens, the archive content rendered in the browser, search and note text, the
Platform endpoint, connected provider account state, and the integrity of the shipped bundle.

## Threats and controls

- **Token theft from storage or script:** storage per the approved ADR, one refresh path, strict CSP,
  no `eval`, no remote code, server-side revocation that makes a stolen token short-lived.
- **Untrusted archive content:** the archive holds attacker-authored pages, posts, and repository
  metadata. Escape and sanitize before rendering, never inject raw HTML, never trust a URL scheme,
  and isolate any embedded content.
- **Privilege confusion:** presentation is never enforcement. A hidden control is not a permission,
  and every action is authorized server-side.
- **Capability spoofing by failure:** a 404 or a timeout never grants or removes a capability, so a
  degraded backend cannot silently change what the client believes it may do.
- **Data leak to third parties:** no third-party analytics, font, error-reporting, or tag host. A
  self-hosted deployment that calls out is a leak regardless of intent.
- **Telemetry leak:** no URL, query string, note text, or search text in logs, telemetry, or a
  diagnostics export; tokens and credentialed endpoints redacted.
- **Destructive-action surprise:** name the object and consequence, require confirmation, check
  capability, carry an idempotency key, and never make it the default focus.
- **Supply-chain attack:** lockfile, reviewed dependencies, pinned actions, audited builds, and a
  dependency budget — every dependency here ships to a browser.
- **Deep-link abuse:** a deep link names a record and carries no token; an unauthenticated one
  resolves through normal authentication rather than granting a view.

Re-review before adding a service worker, offline storage of archive content, file upload, embedded
third-party media, an OAuth flow inside the browser, or any remote configuration.
