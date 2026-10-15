## 1. Web client (workspace SITE-027 tasks 11.1 to 11.4)

- [x] 1.1 RED: add `src/features/sites/SiteSignInConsent.test.tsx` with `shows_site_hostname_and_capabilities`, `confirm_requests_code_and_redirects_to_callback` and `unapproved_site_links_to_approval`. Run them against a stub route that renders an empty page. Confirm that `shows_site_hostname_and_capabilities` fails on its `getByText(hostname)` assertion and the other two on their request and navigation assertions.
- [x] 1.2 GREEN: add the consent page. Verify 1.1 and the accessibility checks of the gate (`npm run test:e2e` and `npm run audit:ui`).
- [x] 1.3 RED: add `src/features/sessions/SessionList.test.tsx` with `site_owner_sessions_are_grouped_by_site`, `revoke_site_sends_the_site_id` and `revoke_one_site_session_sends_its_id`. Confirm that each fails on its assertion that a group for site `blog` or `garden` exists.
- [ ] 1.4 GREEN: show the `site_owner` sessions grouped by site, and end one session or all sessions of a site. Verify 1.3. Generate the API types again from the Platform OpenAPI document of commit `e7a1488`, in a commit of its own. No test: generated file; `npm run api:check` verifies it.
