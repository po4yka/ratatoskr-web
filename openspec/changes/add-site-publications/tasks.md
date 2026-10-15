## 1. Web client (workspace SITE-025 tasks 8.1 to 8.6)

- [x] 1.1 RED: add `src/features/sites/SiteRegistry.test.tsx` with `lists_sites_with_manifest_state`, `approve_sends_the_active_manifest_digest` and `withdraw_calls_delete_approval`, against the mocked gateway. Confirm that the request assertion of the second fails because the feature does not exist.
- [x] 1.2 GREEN: add the site registry and the manifest approval and withdrawal views. Verify that 1.1 passes.
- [x] 1.3 RED: add `src/features/sites/PublicationEditor.test.tsx` with `saves_folders_tags_mode_and_release_mode` and `frontmatter_allowlist_extends_the_default`. Confirm that the request-body assertion of the first fails because the editor does not exist.
- [x] 1.4 GREEN: add the publication editor. Verify that 1.3 passes.
- [x] 1.5 RED: add `src/features/sites/ReleaseHistory.test.tsx` with `shows_current_release_and_build_failures` (including a `sites.slug_collision` failure) and `first_release_is_requested_explicitly`. Confirm that the text assertion of the first fails because the view does not exist.
- [ ] 1.6 GREEN: add the release history and the build request action. Verify that 1.5 passes and that `npm run build` passes.
