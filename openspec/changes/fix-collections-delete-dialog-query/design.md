## Context

`src/features/signout/sign-out.test.tsx` already reads the same kind of dialog with `await screen.findByRole("alertdialog")`. The collections test was the only place in the repository that read a portalled dialog synchronously, so this is a divergence from an idiom the repository had already settled rather than a new decision.

## Rejected alternative: keep the synchronous query and wait first

Inserting a `waitFor` or an `await act(...)` before the existing `getByRole` would also make the test pass, and it would keep an assertion whose correctness depends on guessing how many microtasks the portal takes. `findByRole` states the actual requirement — the dialog appears — and fails with the same diagnostic if it never does.

## Rejected alternative: assert on the trigger's `aria-expanded`

Reading `aria-expanded="true"` on the trigger would be synchronous and stable, but it asserts that the component set an attribute rather than that the operator is shown a confirmation carrying the collection's name. The named copy is the point of the test.

## Why this keeps the assertion's teeth

`findByRole` throws when the element never appears; it does not silently pass. Verified by changing the expected dialog copy to a string that appears nowhere and observing the test fail, then restoring it.
