## Why

Workspace change `add-site-publications` (SITE-025) lets the owner publish parts of a vault as
independent sites. Its group 8 gives this client the owner surface: the site registry, the approval
and the withdrawal of a site manifest, the publication editor and the release history. Before it,
this client had no view of a site.

## What Changes

- Add the route `/sites`: the owner's sites, each with the state of its manifest.
- Add the route `/sites/:siteId`: the active manifest, with the public capabilities apart from the
  owner capabilities, and the approval and the withdrawal of that manifest.
- Add the publication editor to the site view: the vault connection, the included and excluded
  folders, the included tags, the mode, the release mode and the frontmatter fields that a page
  carries in addition to the default allowlist.
- Add the release history to the site view: the current release, the earlier releases and the
  failed builds, and the action that requests a build. The first release is requested explicitly.
- Gate the section on the capability `sites.manage`.

## Capabilities

### New Capabilities

- `site-administration`: the web surface that lists sites, approves and withdraws a manifest, edits
  a publication and requests a release.

### Modified Capabilities

- None.

## Impact

- Affects `src/features/sites/`, the navigation in `src/app/navigation.ts`, the route list in
  `src/app/router.tsx` and the capability vocabulary in `src/capabilities/vocabulary.ts`.
- Adds no dependency. The pinned Edge contract (Platform `3b6efb1`) has no `/v1/sites` route, so the
  site shapes live in `src/features/sites/sites-source.ts`, as the notes shapes live in
  `src/features/notes/`.
- Platform publishes no site capability in `GET /v1/capabilities`. Until it publishes
  `sites.manage`, the section shows the explained absence of the capability gate.
- The workspace store owns the shared behaviour: specs `site-manifest`, `site-publications` and
  `site-route-classes` of change `add-site-publications`.
