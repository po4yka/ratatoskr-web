## Context

Platform at `e7a1488` serves the routes of the owner side of a site sign-in (workspace change
`add-site-owner-editing-and-live`, design D1 and D2):

- `POST /v1/sites/{site}/sign-in-codes` with `{ challenge, return_path }` answers `201` with
  `{ code, redirect_url, expires_at }`. Only a primary session with the live `platform.owner` grant
  gets a code, and only for a site with an approved manifest. Another site answers `404`
  `sites.site_not_found`.
- `GET /v1/sessions` answers one page `{ sessions, next_cursor }`. A session of kind `site_owner`
  carries `site_id` and `hostname`.
- `DELETE /v1/sessions/{session_id}` ends one session.
- `POST /v1/sessions/revoke-site` with `{ site_id }` ends every `site_owner` session of the site and
  answers `{ revoked }`.

That Platform commit is not on `main` yet. The types are generated from it now, and a later commit
generates them again from the pushed commit.

## Decisions

### D1. The consent page is a route of the sites section

The site sends the owner to `/sites/<site>/sign-in?challenge=<C>&return=<path>`. The route is behind
the gate of the sites section (`sites.manage`), as every other site view. A visitor without a
session goes to the sign-in page first, and comes back to the same address.

The page accepts a `challenge` of 43 base64url characters and a `return` path that starts with one
`/`. Another value shows that the sign-in request is not complete, and the page sends nothing.
Platform checks both values again.

### D2. The page shows what the session can use

The page reads `GET /v1/sites` and `GET /v1/sites/{site}/manifest`. It shows the site id, the
hostname of the active manifest, and the capabilities of the manifest, the public ones apart from
the owner ones. When the active manifest is not the approved one, the page offers no sign-in: Platform
binds the code to the approved hostname, and no read route answers the approved hostname or
capabilities. The page links to the approval of the new manifest instead.

### D3. A site that is not approved links to its approval

When the approval state of the site is not `approved`, or the code request answers `404`
`sites.site_not_found`, the page shows no confirmation. It says that the owner must approve the site
first, and links to `/sites/<site>`.

### D4. The page goes only to the approved hostname

After the `201`, the page goes to the parsed form of `redirect_url` with `location.replace`, so that
the consent page is not in the history. It goes only when `redirect_url` is `https://`, the hostname
of the loaded manifest with no port, no user name or password, and the path `/.ratatoskr/sign-in/`.
Another address shows an error, and the page does not go there.

### D5. The session list groups the site sessions by site

`/sessions` reads `GET /v1/sessions` and loads the next page on request. Each site with a live
`site_owner` session gets one group, with its hostname, and each session in it shows the issue time
and the last use. The group offers "End all sessions of <site>", and each session offers "End this
session". Both ask for confirmation, because the site signs the owner out at once.

The other sessions are listed with their kind, their device, the issue time and the last use. Their
revocation is outside this change.

## Risks / Trade-offs

- The types come from a Platform commit that is not pushed (D context). A change to the routes
  before the push makes the generated types wrong until the next generation.
- The consent page is behind `sites.manage`, as the rest of the section. Platform reports that name
  only where Edge routes the sites service (Platform `943bc91`), so a deployment without the sites
  service shows the explained absence of the capability.
