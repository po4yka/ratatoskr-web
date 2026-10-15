## 1. Web client (workspace SITE-025 tasks 8.1 to 8.6)

- [x] 1.1 RED: add `src/features/sites/SiteRegistry.test.tsx` with `lists_sites_with_manifest_state`, `approve_sends_the_active_manifest_digest` and `withdraw_calls_delete_approval`, against the mocked gateway. Confirm that the request assertion of the second fails because the feature does not exist.
- [x] 1.2 GREEN: add the site registry and the manifest approval and withdrawal views. Verify that 1.1 passes.
- [x] 1.3 RED: add `src/features/sites/PublicationEditor.test.tsx` with `saves_folders_tags_mode_and_release_mode` and `frontmatter_allowlist_extends_the_default`. Confirm that the request-body assertion of the first fails because the editor does not exist.
- [x] 1.4 GREEN: add the publication editor. Verify that 1.3 passes.
- [x] 1.5 RED: add `src/features/sites/ReleaseHistory.test.tsx` with `shows_current_release_and_build_failures` (including a `sites.slug_collision` failure) and `first_release_is_requested_explicitly`. Confirm that the text assertion of the first fails because the view does not exist.
- [x] 1.6 GREEN: add the release history and the build request action. Verify that 1.5 passes and that `npm run build` passes.
- [ ] 1.7 RED: `src/features/sites/PublicationEditor.test.tsx` "shows_the_publication_state". Confirm that it fails on the text assertion, because the editor does not show the `state` of a stored publication.
- [ ] 1.8 GREEN: show the state `active` or `suspended` of a stored publication, and what the owner does to make a suspended publication active again. Verify 1.7, and run the gate list of `DEVELOPMENT.md`.
- [ ] 1.9 RED: `src/features/sites/ReleaseHistory.test.tsx` "unapproved_site_cannot_start_a_release". Confirm that it fails on the text assertion, because the view offers the build of a site that is not approved and gives no hint.
- [ ] 1.10 GREEN: when the site is not approved, say "Approve the site before the first release." (for a site that has releases, "Approve the site again before a new release."), and disable the build request. Verify 1.9, and run the gate list of `DEVELOPMENT.md`.
