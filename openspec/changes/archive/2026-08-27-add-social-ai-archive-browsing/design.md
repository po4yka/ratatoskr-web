## Context

See [proposal.md](proposal.md) and
`social-ai-archive-browsing/spec.md`. The existing shell gates both navigation
and direct routes through a closed client capability vocabulary, lazily loads
feature modules, and keeps fixture-backed GitHub/Vault projections behind an
integration-pending notice. The pinned Edge schema has only the generic
`social.source.sync` capability example; it declares no social-post,
AI-archive, provider-connection, or OAuth-start projections for this client.

The Claude archive model defines `LocallyBackedUp` only for verified local
evidence; missing and quarantined evidence derive `ReferenceOnly`. Its
authorization observations deliberately do not mutate that result. The reader
must preserve that separation.

## Goals / Non-Goals

**Goals:**

- Add bounded, injectable fixture projections that can later be replaced with
  generated Edge calls without changing reader components.
- Make provenance, completeness, and preservation evidence visible in compact,
  keyboard-usable reader views following the existing shell and design tokens.
- Exercise the same capability gate for clicked navigation and direct routes.

**Non-Goals:**

- Direct calls to X, Instagram, Threads, ChatGPT, Claude, or any provider;
  browser-owned OAuth state, verifier, callback, or token storage; live
  revocation; content extraction; or a claim that fixture disconnect revokes an
  upstream grant.
- Generated-contract changes, a new capability-negotiation format, service-side
  import/backup execution, pagination protocol, or unbounded browser lists.

## Decisions

### One fixture boundary separates supplied projections from views

A feature-local source will expose immutable snapshots for social posts, AI
imports/conversations/projects/artifacts, and provider connection summaries,
plus a narrow `disconnect(provider)` operation. Its fixture marker is carried
in the snapshot so every page can show integration pending. No request will go
through the gateway until a generated Edge operation exists.

This follows the GitHub/Vault fixture pattern rather than creating hand-written
gateway types. A mock endpoint was rejected because it would make an
undeclared API appear live.

### Routes use fixture-only capabilities while contracts are absent

The registry will gain one fixture-only capability per service and route group:
X, Instagram, Threads, ChatGPT, Claude, and provider connections. Social list
and detail routes share their provider gate; AI archive, conversation, project,
and artifact routes share their provider gate. The connection page renders only
the connection summaries whose capabilities are present.

This keeps route and navigation behavior server-driven through the existing
gate while explicitly avoiding claims that these strings are published Edge
vocabulary. A single ungated archive route was rejected because it would
exercise neither absence behavior nor deployment truthfulness.

### Provenance and Document IR links are projection fields, not UI inference

Social fixtures will carry an acquisition discriminator with exactly three
rendered mappings: bookmark snapshot, explicit capture, and import. A post can
also carry an optional document identifier. The presentation maps the supplied
discriminator to text and renders `/documents/:id` only when that optional
identifier exists; it never infers extraction from a URL, a folder, or a
provider.

This respects the workspace Document IR boundary, where the extractor owns the
document and provenance. Parsing social content in the client was rejected as
both a boundary violation and a source of false provenance.

### AI import, conversation, project, and artifact data remain ordered and typed

Fixture projections will model an import outcome plus completeness report;
projects containing conversation identifiers; conversations with ordered
messages; typed content parts; and Claude artifacts with ordered versions.
Reader components render those values as supplied and have separate loading,
empty, partial, error, offline, and unauthorized surfaces. Content parts will
be rendered as text, code, or a labelled attachment reference rather than as
HTML, preserving the hostile-content boundary.

One generic rich-text renderer was rejected because it would erase content-part
kind and risks treating provider-controlled text as markup.

### Local backup presentation follows the Claude evidence model

Every displayed Claude project, conversation, and artifact will carry supplied
local-evidence and derived local-backup-status fields. A pure formatter will
map only `locally_backed_up` with `verified` evidence to the affirmative label;
`reference_only`, missing evidence, or quarantined evidence produce an explicit
not-locally-backed-up label. Authorization and connected fields are displayed
separately and never enter that mapping.

The client will not recompute service history or alter it after a connection
change. Inferring preservation from `connected`, a current OAuth result, an
artifact URL, or a successful import was rejected because the Claude service
model explicitly separates those facts.

### Connection controls use source-supplied authority and consented disconnect

Connection cards display redacted status. An OAuth action is a normal link only
when its summary includes the exact provider authorization URL. A missing URL
has a readable explanation, not a disabled control. Disconnect creates a
pending confirmation command naming the provider and effect; only confirmation
calls the source once and then refreshes the snapshot. Fixture mode reports
that no live revocation occurred.

Browser-built OAuth, token/PAT forms, and disconnect without confirmation were
rejected because the Edge contract supplies none of their semantics and
revocation is destructive.

## Risks / Trade-offs

- [Fixture projections drift from future Edge types] → keep them feature-local,
  bounded, visibly integration-pending, and replace them in a dedicated
  workspace contract/type-regeneration change.
- [Connection state is mistaken for preservation evidence] → test verified,
  missing, quarantined, and expired-authorization fixtures independently.
- [A post with no Document IR appears extracted] → make the cross-link optional
  and assert its absence in detail tests.
- [Provider content creates an unsafe reader] → render typed text/code/reference
  nodes only; do not use provider HTML or embed remote media.
- [Disconnect fires by mistake] → retain the command only in the confirmation
  composition and assert cancellation produces no source call.
- [Large provider datasets reach the browser] → keep fixtures bounded; require
  contract pagination before live integration.

## Migration Plan

1. Add fixture-gated routes, navigation entries, source seam, reader views, and
   integration-pending notices with focused tests.
2. When the workspace contract publishes the Edge projections, capability
   names, OAuth facade, disconnect/revocation semantics, and pagination, update
   the contract pin in its own regeneration commit and replace the source with
   generated gateway calls.
3. Retain the capability, provenance, completeness, evidence, and confirmation
   tests against a local Edge mock.
4. Roll back by removing the new fixture navigation entries and routes; the
   fixture source is non-durable and no provider write has occurred.
