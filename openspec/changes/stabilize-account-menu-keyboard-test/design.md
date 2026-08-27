## Context

The product already supports keyboard activation of the Base UI account menu. The hosted failure is confined to a test whose setup contradicts its keyboard-only claim by dispatching a click. See `proposal.md` for the failure evidence.

## Goals / Non-Goals

**Goals:**

- Exercise the same Enter-key activation path a keyboard user uses.
- Preserve the existing confirmation assertion and production implementation.

**Non-Goals:**

- Changing account-menu or sign-out behavior.
- Adding a test interaction dependency.

## Decisions

Dispatch Enter keydown and keyup on the focused trigger, then explicitly dispatch the native button click that a browser synthesizes for Enter because jsdom does not perform that default action. Keep the role-based asynchronous query for the portal content. This models the complete keyboard activation sequence without adding `user-event` solely for one correction. A standalone synthetic click was rejected because it cannot prove keyboard operability and produced the hosted failure.

## Risks / Trade-offs

- [Risk] A low-level keyboard event could omit a field Base UI reads. -> Include both `key` and `code`, then repeat the focused test before the full gate.
- [Risk] A local pass could hide runner-only timing. -> Require the exact hosted CI workflow to pass at the published commit.
