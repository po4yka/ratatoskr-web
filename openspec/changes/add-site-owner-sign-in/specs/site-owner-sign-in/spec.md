## Purpose

Give the owner the consent page of a site sign-in, and the `site_owner` sessions in the session
list. The shared behaviour lives in the workspace store, spec `site-owner-session` of change
`add-site-owner-editing-and-live`.

## ADDED Requirements

### Requirement: The consent page shows the site and its capabilities

The consent page SHALL show the site id, the hostname of the active manifest and the capabilities
of the manifest before the owner confirms a sign-in.

#### Scenario: The owner opens the consent page of an approved site

- **WHEN** the owner opens `/sites/blog/sign-in` with a challenge and a return path, and `blog` is approved
- **THEN** the page shows the hostname and the capabilities of the manifest, verified by `src/features/sites/SiteSignInConsent.test.tsx` "shows_site_hostname_and_capabilities"

### Requirement: A confirmed sign-in requests a code and goes to the site

When the owner confirms, the client SHALL send `POST /v1/sites/{site}/sign-in-codes` with the
challenge and the return path, and SHALL then go to the `redirect_url` of the answer.

#### Scenario: The owner confirms a sign-in

- **WHEN** the owner confirms the sign-in on the consent page of `blog`
- **THEN** the request body is the challenge and the return path, and the client goes to the callback page of the hostname of `blog`, verified by `src/features/sites/SiteSignInConsent.test.tsx` "confirm_requests_code_and_redirects_to_callback"

### Requirement: A site that is not approved links to its approval

The consent page of a site that is not approved SHALL offer no confirmation, and SHALL link to the
approval of the site.

#### Scenario: The owner opens the consent page of an unapproved site

- **WHEN** the owner opens the consent page of a site that is not approved
- **THEN** no code is requested and the page links to `/sites/<site>`, verified by `src/features/sites/SiteSignInConsent.test.tsx` "unapproved_site_links_to_approval"

### Requirement: The session list groups site sessions by site

The session list SHALL show each live `site_owner` session in a group of its site, with the hostname
of the site, the issue time and the last use of the session.

#### Scenario: Sessions of two sites

- **WHEN** the user has two `site_owner` sessions of site `blog`, one of site `garden` and one browser session
- **THEN** the list has one group for `blog` with two sessions and one group for `garden` with one, verified by `src/features/sessions/SessionList.test.tsx` "site_owner_sessions_are_grouped_by_site"

### Requirement: The owner ends the sessions of a site

The owner SHALL be able to end every session of one site with `POST /v1/sessions/revoke-site`, and
one session with `DELETE /v1/sessions/{session_id}`. Each action SHALL ask for confirmation first.

#### Scenario: The owner ends all sessions of a site

- **WHEN** the owner selects "End all sessions of blog" and confirms
- **THEN** the client sends `POST /v1/sessions/revoke-site` with `{"site_id":"blog"}`, verified by `src/features/sessions/SessionList.test.tsx` "revoke_site_sends_the_site_id"

#### Scenario: The owner ends one site session

- **WHEN** the owner selects "End this session" on a session of `garden` and confirms
- **THEN** the client sends `DELETE /v1/sessions/<that session id>`, verified by `src/features/sessions/SessionList.test.tsx` "revoke_one_site_session_sends_its_id"
