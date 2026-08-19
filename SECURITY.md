# Security Policy for Ratatoskr Web

Report vulnerabilities privately. Do not publish session or device tokens, private archive URLs,
note or search text, real archive fixtures, production endpoints, or screenshots containing user
content.

Security review is required for every change to the fetch gateway, token storage and refresh,
session and device revocation, capability gating, destructive or external-write flows, deep-link
handling, rendering of untrusted archive content, Content Security Policy, and every added
dependency.

Baseline: one network boundary, the public Edge API; no direct service, database, object store, or
message-bus access; provider tokens never reach the browser; token storage follows the approved ADR;
one refresh path with server-side revocation; presentation is never enforcement, the server decides;
archive content is untrusted and is escaped and sanitized before rendering, with no raw HTML
injection and no `eval`; strict CSP with no remote code and no third-party analytics, font, or
error-reporting host; external writes require capability, explicit confirmation, and an idempotency
key; TLS with an explicit endpoint allowlist; logs, telemetry, and diagnostics carry no URLs, query
strings, note text, search text, or tokens; dependencies are lockfiled, reviewed, and audited.
