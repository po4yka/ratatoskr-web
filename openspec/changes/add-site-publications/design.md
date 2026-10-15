## Context

Platform at `3a47f0f` serves the site routes of workspace change `add-site-publications`:

- `GET /v1/sites` answers `{ sites: [{ site_id, submitted_manifest_sha256, approved_manifest_sha256,
  approval_state }] }`, and `approval_state` is `unapproved`, `approved` or `withdrawn`;
- `GET /v1/sites/{site}/manifest` answers the active manifest `{ site_id, manifest_sha256, hostname,
  publications, capabilities }`;
- `POST /v1/sites/{site}/manifest/approval` with `{ manifest_sha256 }` answers `200` with the
  approval `{ site_id, manifest_sha256, capabilities, hostname, state }`, or `409` with
  `platform.site.manifest_digest_stale` or `platform.site.hostname_taken`;
- `DELETE /v1/sites/{site}/manifest/approval` answers `200` with the approval in the state
  `withdrawn`;
- `POST /v1/sites/{site}/releases` with an `Idempotency-Key` answers `202` with
  `{ operation_id, status: "accepted" }`;
- Edge forwards `GET`, `PUT` and `DELETE` of `/v1/sites/{site}/publications/{publication}` and
  `GET /v1/sites/{site}/releases` to `ratatoskr-sites` as management routes.

The sites service does not serve the publication and release routes yet.

## Decisions

### D1. The approval names the digest that the view shows

The approve action sends the `manifest_sha256` of the manifest that the view loaded, never a digest
from the site list. When a newer manifest became active, Edge refuses the approval as stale, and the
view loads the manifest again.

### D2. Public capabilities are shown apart from owner capabilities

`pages.read`, `assets.read`, `search.publication` and `live.release` are available to any visitor
of the site. The other names are available only to an owner session, which Platform does not issue
yet. The approval view lists the two groups under separate headings, so the owner sees what an
approval opens to the public.

### D3. The publication shape follows the sites schema

The publication editor sends `PUT /v1/sites/{site}/publications/{publication}` with
`connection_id`, `mode` (`all` or `flagged`), `release_mode` (`automatic` or `manual`),
`included_folders`, `excluded_folders`, `included_tags` and `frontmatter_allow`. The names are the
columns of `sites.publications` in `ratatoskr-sites`. `frontmatter_allow` holds only the fields that
the owner adds: the default allowlist of spec `site-release-privacy` always applies.

### D4. The release history shape is provisional

`GET /v1/sites/{site}/releases` answers `{ current_release_id, releases: [{ release_id, built_at,
page_count }], failed_builds: [{ operation_id, failed_at, code, message }] }` in this client. The
names of a release are the columns of `sites.releases`. The sites service does not define this
route yet, so the shape changes when it does.

### D5. The first release is a separate action

When the site has no release, the view says that the first release is built only on request and
offers "Build the first release". A build request keeps one `Idempotency-Key` until an answer
accepts it.

## Risks / Trade-offs

- Platform publishes no site capability. The name `sites.manage` is this client's proposal; the
  section stays unavailable until Platform publishes that name.
- The publication and release shapes are not served by `ratatoskr-sites` yet (D3, D4).
- The editor has no control for `DELETE` of a publication.
