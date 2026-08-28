## Why the timeout is raised and not merely tolerated

A poll window is not an assertion. `findByRole` throws the same `TestingLibraryElementError` whether the window is 1000ms or 5000ms; what the number decides is how slow a machine may be before a correct render is reported as a defect. The default is tuned for an idle developer machine, and a two-core hosted runner rendering a whole React application and then mounting a portalled menu is not that. Raising it cannot make a broken menu pass.

The teeth of the test were checked rather than assumed: with the window at 5000ms, pointing the query at a menu item that exists nowhere still fails, after roughly 5.4 seconds instead of roughly 1. The failure mode is preserved; only the deadline moved.

## Why the route stubs are not enough on their own

They were tried alone first. Under induced CPU contention the isolated file went from one failure in eight runs to ten passes in ten, but a full-suite run still reproduced the original failure once. `vite.config.ts` sets `fileParallelism: false`, so test files do not compete with each other — the residual cost is the work of the test itself, and no amount of removing unrelated work brings a full application render plus a portal mount reliably under one second on a constrained runner.

They are kept because the work they remove is genuinely unnecessary: a test about the shell's chrome should not be waiting on a feature page it never looks at. The two changes address different halves of the same measurement.

## Rejected alternative: raise the timeout alone

This was tried in an earlier attempt and rejected. On its own it leaves every shell test still paying for a module transform it does not need, and it was measured still failing two runs in seven. Presented as a root-cause fix it would also have been misleading: the earlier stabilization attempt on this same suite patched one call site at a time and did not hold, and a second round of the same move would have read as a fix while changing nothing structural.

## Rejected alternative: a per-call timeout on the one flaky query

More surgical, but it encodes the deadline at the one call site that has failed so far and leaves the next equally slow query to be patched after its own red run — which is the pattern that already failed here once. The constraint is environmental and applies to every async query in the suite, so it belongs in the suite's configuration.
