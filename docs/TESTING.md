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
- Accessibility: keyboard traversal and focus management, landmarks, automated serious/critical axe
  findings, pointer targets, overflow, contrast, and reduced-motion in both themes and at desktop and
  320-pixel widths.
- End-to-end: sign in, search, read, curate, capture, watch an operation to completion, revoke a
  device.

Component tests use local fixtures and mocks. Playwright runs the browser against the mock Platform;
the workspace runs a separate smoke against its isolated Compose profile and compatible repository
pins. Neither uses a live deployment, a real provider account, or a real user archive. The latest
manual and automated accessibility matrix is committed in `docs/ACCESSIBILITY_CHECKLIST.md`.

## Test-first

A change is planned before it is built, and the plan is a task list in which behaviour arrives in
pairs: one task adds a failing test, the next makes it pass. `openspec/config.yaml` carries that
rule, which is what puts it into every planning and implementation request rather than only into this
document.

The loop:

1. Write the test the scenario names. Run it. Confirm it fails, and read the failure — a test that
   fails because it does not compile has proved nothing about the behaviour.
2. Write the smallest change that makes it pass. Run it again.
3. Refactor only once it is green, adding no test and changing no behaviour.

Two checks stand behind this, and neither of them can see the order:

- `openspec validate --archived`, in `.github/workflows/openspec.yml`, fails when a change was
  archived with a task left unticked.
- A step in `.github/workflows/fleet.yml` fails when this repository holds a manifest and a `ci.yml`
  that never runs a test.

`ratatoskr-workspace/docs/QUALITY_GATES.md` records why the order itself is not checkable, rather
than leaving the gap to be discovered.
