# Web testing strategy

Required tests:

- Gateway: refresh with a single in-flight request, retry bounds, and error normalization across
  offline, unauthenticated, revoked, forbidden, unsupported, not-found, invalid, partial, terminal.
- Contract: generated types match the pinned digest; a drift fails.
- Capability gating: absent, present-unconfigured, and present-configured render distinctly, and no
  control fails on click.
- Views: loading, empty, partial, error, unauthorized, and offline states for each.
- Untrusted content: hostile HTML, script, URL schemes, and Unicode in titles, bodies, and metadata
  render escaped.
- Operations: duplicate and out-of-order events, stream drop and polling recovery, reload mid-run.
- Destructive actions: confirmation required, idempotency key present, capability checked.
- Session: sign-out revokes server-side; revocation elsewhere is observed here.
- Accessibility: keyboard traversal, visible focus, contrast, and reduced-motion on shell, search,
  and reader, in both themes.
- End-to-end: sign in, search, read, curate, capture, watch an operation to completion, revoke a
  device.

Tests use a local mock Platform or the workspace Compose profile. Never a live deployment, a real
provider account, or a real user archive.
