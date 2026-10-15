## Why

Workspace change `add-site-owner-editing-and-live` (SITE-027) lets the owner edit a site from the
site itself. The site gets an owner session of kind `site_owner`, and the owner's primary session in
this client approves each sign-in. Its group 11 gives this client two surfaces: the consent page of
a site sign-in, and the `site_owner` sessions in the session list. Before it, this client had no
session list.

## What Changes

- Add the route `/sites/:siteId/sign-in?challenge=<C>&return=<path>`: the consent page. It shows the
  site id, the approved hostname and the capabilities of the site. When the owner confirms, it sends
  `POST /v1/sites/{site}/sign-in-codes` and goes to the callback page of the site.
- A site that is not approved gets no code. The consent page links to the approval of the site.
- Add the route `/sessions`, which the account menu opens: the live sessions of the user. The
  `site_owner` sessions are grouped by site, with the hostname, the issue time and the last use.
- The owner can end one `site_owner` session (`DELETE /v1/sessions/{session_id}`) or every session
  of one site (`POST /v1/sessions/revoke-site`). Each action asks for confirmation.
- Regenerate the API types from the Platform OpenAPI document of commit `e7a1488`, which describes
  the site routes, the sign-in code and the revocation by site.

## Capabilities

### New Capabilities

- `site-owner-sign-in`: the consent page of a site sign-in, and the `site_owner` sessions in the
  session list with their revocation.

### Modified Capabilities

- None.

## Impact

- Affects `src/features/sites/`, the new `src/features/sessions/`, the route list in
  `src/app/router.tsx`, the account menu, and the generated types in `src/api/generated/schema.ts`.
- Adds no dependency.
- The workspace store owns the shared behaviour: spec `site-owner-session` of change
  `add-site-owner-editing-and-live`, and its design D1 and D2.
