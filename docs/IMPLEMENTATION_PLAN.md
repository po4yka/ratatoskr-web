# Web implementation plan

1. ~~Scaffold the project with lint, typecheck, test, build, and `ci.yml`.~~ Done. React 19,
   TypeScript 6, Vite 8, Tailwind 4, shadcn/ui on Base UI, ESLint, Prettier, Vitest. CSP is not
   set yet: it belongs with the first served page, not with the build.
2. ~~Generate API types from the pinned contract and fail the build on drift.~~ Done. Types are generated from a digest-pinned copy of the platform contract, and `api:check` fails the gate when the pin or the generated output drifts.
3. Build the fetch gateway: refresh, retry, error normalization, and query keys.
4. Implement session boot, the protected shell, sign-out, and the unauthorized state.
5. ~~Implement capability discovery and the gating rules that follow from it.~~ Done. The client
   reads `/v1/capabilities` for authenticated sessions, refreshes on reconnect, and gates
   navigation and routes through one typed rule; an absent capability renders an explained absence,
   a failed read its own retryable state.
6. Implement search and the article reader with provenance and warnings.
7. ~~Add collections and tags.~~ Done as a fixture-backed first slice: the
   protected collections list/detail and tags routes support curation flows,
   optimistic rollback, merge review, and URL-addressable tag filtering.
   Integration is pending: Knowledge prompt 6 still needs owner approval and
   the generated Edge contract declares neither the user-content operations nor
   their capability names, so the client does not invent either. Nested and
   smart collections, public links, and collaborators remain deferred
   server-side follow-ups.
8. Add capture by URL and operation tracking with streaming and polling recovery.
9. ~~Add the GitHub catalog and Git Vault views, including restore verification evidence.~~ Done as a
   fixture-backed first slice: capability-gated GitHub connection/catalog/detail views and Git Vault
   mirror, snapshot, manifest-digest, and restore-drill evidence views are available. Integration is
   pending because the generated Edge contract declares neither these operations nor their capability
   names; fixture interactions do not claim a live provider write or backup verification. Star-list
   management depth and watch configuration remain server-contract follow-ups.
10. ~~Add social and AI-archive browsing with truthful provenance.~~ Done as a
    fixture-backed first slice: capability-gated X, Instagram, and Threads
    post readers render supplied acquisition provenance, folder filters, and
    Document IR links; ChatGPT and Claude archive readers render import
    completeness, conversations, projects, and Claude artifact versions.
    Provider connections expose only supplied OAuth redirects and confirmed
    fixture disconnects. Local-backup status follows explicit evidence rather
    than authorization. Integration remains pending on Edge projections,
    capability names, OAuth/disconnect semantics, and pagination.
11. Add settings: sessions, devices, provider accounts, and revocation.
12. ~~Add operational views, the public status page, accessibility hardening, and workspace
    integration.~~ The public `/status` route consumes the anonymous sanitized status endpoint.
    Owner-gated inspectors expose operations, schedules, and the audit trail with explicit loading,
    empty, forbidden, offline, and failure states. The browser gate covers keyboard focus, landmarks,
    serious/critical axe findings, target size, overflow, themes, and narrow viewports. The sibling
    workspace changeset owns the composed-profile smoke.

    Deferred fleet decisions: an LLM cost dashboard needs a Knowledge cost-ledger contract;
    digest/RSS, signals, and chat-agent surfaces have no assigned subsystem; EN/RU needs a shared
    localization framework; the command palette and global agent dock remain unimplemented. These
    are not implied by the operational routes shipped here.

Definition of Done: the client reaches only the Edge API; generated types match the pinned contract;
capability gating is server-driven; every added view has its loading, empty, partial, error,
unauthorized, and offline states; provenance and verification are truthful; destructive actions are
confirmed and idempotent; no user content reaches telemetry; keyboard and contrast hold in both
themes; and the repository and workspace tests pass.
