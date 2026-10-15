## 1. Web client (workspace SITE-027 tasks 11.1 to 11.4)

- [x] 1.1 RED: add `src/features/sites/SiteSignInConsent.test.tsx` with `shows_site_hostname_and_capabilities`, `confirm_requests_code_and_redirects_to_callback` and `unapproved_site_links_to_approval`. Run them against a stub route that renders an empty page. Confirm that `shows_site_hostname_and_capabilities` fails on its `getByText(hostname)` assertion and the other two on their request and navigation assertions.
- [x] 1.2 GREEN: add the consent page. Verify 1.1 and the accessibility checks of the gate (`npm run test:e2e` and `npm run audit:ui`).
- [x] 1.3 RED: add `src/features/sessions/SessionList.test.tsx` with `site_owner_sessions_are_grouped_by_site`, `revoke_site_sends_the_site_id` and `revoke_one_site_session_sends_its_id`. Confirm that each fails on its assertion that a group for site `blog` or `garden` exists.
- [x] 1.4 GREEN: show the `site_owner` sessions grouped by site, and end one session or all sessions of a site. Verify 1.3. Generate the API types again from the Platform OpenAPI document of commit `e7a1488`, in a commit of its own. No test: generated file; `npm run api:check` verifies it.

## 2. Fixes of the review of group 11

- [x] 2.1 RED: `src/features/sites/SiteSignInConsent.test.tsx` `pending_manifest_offers_no_sign_in`. Confirm that it fails on the assertion that no "Sign in to garden" button exists, because the page offers the sign-in while a new manifest waits for approval.
- [x] 2.2 GREEN: when the active manifest is not the approved one, offer no sign-in, and link to the approval of the new manifest. Platform answers no approved hostname or capabilities on a read route, so the page cannot show them. Verify 2.1, and run the gate list of `DEVELOPMENT.md`.
- [x] 2.3 RED: `src/features/sites/site-sign-in.test.ts` "accepts only the callback page of the approved hostname" (a table: suffix host, userinfo, `http:`, port, trailing dot, other path), and `SiteSignInConsent.test.tsx` `refused_hostname_is_not_followed` and `callback_is_followed_in_its_parsed_form`. Confirm that the userinfo and path rows and the parsed-form case fail on their assertions, and that the refused-hostname case fails when the hostname check is deleted.
- [x] 2.4 GREEN: refuse a callback with a user name or a password, or with a path other than `/.ratatoskr/sign-in/`, and go to the parsed `href`. Verify 2.3, and run the gate list of `DEVELOPMENT.md`.
- [x] 2.5 REFACTOR: rename `isOnHostname` to `isSignInCallback`. No test: no behaviour changes.
- [x] 2.6 RED: `SiteSignInConsent.test.tsx` `unapproved_site_links_to_approval_when_the_manifest_fails`. Confirm that it fails on the lookup of the "Approve the site" link, because a failed manifest read hides the approval state.
- [ ] 2.7 GREEN: read the site list and the manifest apart, and show the approval link when the list says that the site is not approved. Verify 2.6, and run the gate list of `DEVELOPMENT.md`.
- [ ] 2.8 RED: `src/features/sessions/SessionList.test.tsx` `revoke_keeps_the_loaded_pages_and_counts`, `buttons_wait_while_a_revoke_runs` and `an_invalid_time_shows_the_absence`. Confirm that they fail on their assertions: the list loads again from the first page, the message has no count, the buttons stay enabled, and an invalid time shows "Invalid Date".
- [ ] 2.9 GREEN: remove the ended sessions from the loaded pages, name the `revoked` count, disable the buttons of a group while its revocation runs, and show the absence text for an invalid time. Verify 2.8, and run the gate list of `DEVELOPMENT.md`.
- [ ] 2.10 Correct the comment on `sites.manage` in `src/capabilities/vocabulary.ts`. No test: comment text.
