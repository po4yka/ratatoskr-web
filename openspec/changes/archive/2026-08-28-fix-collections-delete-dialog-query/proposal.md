## Why

`requires named confirmation before deletion` in `src/features/collections/collections-page.test.tsx` queried the delete confirmation dialog with the synchronous `screen.getByRole("alertdialog")` on the line after the click that opens it. The dialog is a Base UI `AlertDialog` rendered through a portal, so whether it is in the document by the time the next statement runs is a property of the environment rather than of the component. It happens to be there on a developer machine and was not there on the CI runner, where the gate failed with `TestingLibraryElementError: Unable to find an accessible element with the role "alertdialog"`.

## What Changes

- Query the confirmation dialog and its named confirm button with the asynchronous `findByRole`, which retries until the portal has mounted, in place of the synchronous `getByRole`.
- No change to what is asserted: the dialog must still carry the named-confirmation copy, the named confirm button must still be the thing clicked, and the page must still return to the collections heading afterwards.

## Capabilities

No product behaviour changes. This corrects an unsound assumption in a test about when portalled content is in the document; `skip_specs: true` is set in the change manifest.

## Impact

- `src/features/collections/collections-page.test.tsx`.
- No component, route, contract, or generated artifact.
