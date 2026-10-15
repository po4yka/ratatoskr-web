## Purpose

Give the owner the surface that manages sites: the site registry, the approval and the withdrawal
of a site manifest, the publication editor and the release history. The shared behaviour lives in
the workspace store, specs `site-manifest`, `site-publications` and `site-route-classes` of change
`add-site-publications`.

## ADDED Requirements

### Requirement: The registry shows the manifest state of each site

The site registry SHALL list each site of `GET /v1/sites` with its approval state, and SHALL say
when the active manifest is not the approved one.

#### Scenario: The owner opens the registry

- **WHEN** the owner opens `/sites` and the deployment has an approved, an unapproved and a withdrawn site
- **THEN** each site shows its state, and the approved site whose active manifest changed says that it waits for approval, verified by `src/features/sites/SiteRegistry.test.tsx` "lists_sites_with_manifest_state"

### Requirement: An approval names the digest of the loaded manifest

The approve action SHALL send `POST /v1/sites/{site}/manifest/approval` with the `manifest_sha256`
of the active manifest that the view loaded.

#### Scenario: The owner approves a manifest

- **WHEN** the owner opens a site and approves its manifest
- **THEN** the request body is the digest of the loaded manifest, verified by `src/features/sites/SiteRegistry.test.tsx` "approve_sends_the_active_manifest_digest"

### Requirement: A withdrawal deletes the approval

The withdraw action SHALL send `DELETE /v1/sites/{site}/manifest/approval` after the owner confirms
it.

#### Scenario: The owner withdraws an approval

- **WHEN** the owner withdraws the approval of an approved site and confirms
- **THEN** the client sends the `DELETE` of the approval, verified by `src/features/sites/SiteRegistry.test.tsx` "withdraw_calls_delete_approval"

### Requirement: The publication editor saves the whole selection

The publication editor SHALL send `PUT /v1/sites/{site}/publications/{publication}` with the vault
connection, the included and excluded folders, the included tags, the mode, the release mode and
the added frontmatter fields.

#### Scenario: The owner saves a publication

- **WHEN** the owner changes the folders, the tags, the mode and the release mode of a publication and saves it
- **THEN** the request body carries each value, verified by `src/features/sites/PublicationEditor.test.tsx` "saves_folders_tags_mode_and_release_mode"

#### Scenario: The owner adds a frontmatter field

- **WHEN** the owner adds a frontmatter field to a publication
- **THEN** the editor shows the default allowlist and the added field, and the request body carries only the added field, verified by `src/features/sites/PublicationEditor.test.tsx` "frontmatter_allowlist_extends_the_default"

### Requirement: The release history shows the current release and the failed builds

The release history SHALL show the current release of the site and each failed build with a
sentence for its code.

#### Scenario: A build failed on a slug collision

- **WHEN** the site has a current release and a build that failed with `sites.slug_collision`
- **THEN** the view shows the current release and says that two files have the same slug, verified by `src/features/sites/ReleaseHistory.test.tsx` "shows_current_release_and_build_failures"

### Requirement: The first release is requested explicitly

When a site has no release, the view SHALL send no build request until the owner asks for the first
release, and SHALL then send `POST /v1/sites/{site}/releases` with an `Idempotency-Key`.

#### Scenario: A site without a release

- **WHEN** the owner opens a site that has no release
- **THEN** no build request is sent until the owner selects "Build the first release", verified by `src/features/sites/ReleaseHistory.test.tsx` "first_release_is_requested_explicitly"

### Requirement: The publication list shows the state of each publication

The editor of a stored publication SHALL show its state, `active` or `suspended`, and for a
suspended publication SHALL say how the owner makes it active again.

#### Scenario: A publication whose vault was disconnected

- **WHEN** the owner opens a site with a stored publication in the state `suspended`, and then one in the state `active`
- **THEN** the first says that it is suspended and that a vault connection makes it active again, and the second says that it is active, verified by `src/features/sites/PublicationEditor.test.tsx` "shows_the_publication_state"

### Requirement: A release of a site that is not approved cannot start

When the approval state of the site is not `approved`, the release history SHALL say that the owner
must approve the site first, and SHALL offer no build request.

#### Scenario: The owner opens the releases of an unapproved site

- **WHEN** the owner opens a site that is not approved and has no release
- **THEN** the view says "Approve the site before the first release." and the build control is disabled, verified by `src/features/sites/ReleaseHistory.test.tsx` "unapproved_site_cannot_start_a_release"
