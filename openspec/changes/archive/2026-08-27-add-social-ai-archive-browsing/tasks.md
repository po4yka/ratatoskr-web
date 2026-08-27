## 1. Fixture capability and source boundary

- [x] 1.1 Add failing assertions in `src/components/shell/nav-gating.test.tsx` and `src/app/capability-route.test.tsx` named `hides social and AI archive providers when their capabilities are absent` and `explains a direct social reader route whose provider is absent`; run them and confirm they fail because the provider entries and routes are not registered.
- [x] 1.2 Add fixture-only provider capability names, lazy route seams, navigation entries, and direct-route gates; verify task 1.1 passes and the fixture names are absent from `src/api/generated/schema.ts`.
- [x] 1.3 Add failing `src/features/social-ai-archive/archive-source.test.ts` tests named `keeps social and AI projections integration-pending` and `preserves supplied typed, ordered archive records without a gateway request`; run them and confirm their behavioral assertions fail before implementing the fixture source.
- [x] 1.4 Implement the bounded injectable fixture source for social posts, folders, Document IR links, AI imports/projects/conversations/artifacts, local evidence, and provider summaries; verify task 1.3 passes without an undeclared Edge request or hand-written wire type.

## 2. Social post list and detail

- [x] 2.1 Add failing `src/features/social-ai-archive/social-posts-page.test.tsx` tests named `maps bookmark snapshot explicit capture and import provenance badges`, `filters by supplied folder`, and `links only a post with supplied Document IR`; run them and confirm the expected labels, filtered result, and conditional link are missing before implementation.
- [x] 2.2 Implement capability-gated social post list/detail views for X, Instagram, and Threads with readable provenance, optional folder selection, supplied-only Document IR cross-links, and loading, empty, partial, error, offline, and unauthorized states; verify task 2.1 passes and a post lacking Document IR has no document link.

## 3. AI archive and conversation readers

- [x] 3.1 Add failing `src/features/social-ai-archive/ai-archive-page.test.tsx` tests named `renders import status and completeness gaps` and `renders a fixture export conversation in supplied message and content-part order`; run them and confirm the import outcome, gaps, project heading, text, code, and attachment assertions fail before implementation.
- [x] 3.2 Implement ChatGPT and Claude archive lists plus import-status/completeness and conversation reader views, rendering project grouping and typed text, code, and attachment-reference parts without provider HTML; verify task 3.1 passes and incomplete imports never display a complete claim.
- [x] 3.3 Add a failing `src/features/social-ai-archive/ai-artifact-page.test.tsx` test named `lists all supplied Claude artifact versions`; run it and confirm the version-specific assertions fail before implementation.
- [x] 3.4 Implement project and artifact routes with supplied conversation grouping and all artifact versions, including loading, empty, partial, error, offline, and unauthorized states; verify task 3.3 passes without collapsing versions.

## 4. Evidence-derived backup presentation

- [x] 4.1 Add failing `src/features/social-ai-archive/backup-status.test.ts` tests named `renders locally backed up only for verified evidence`, `renders missing and quarantined evidence as reference only`, and `does not change evidence status when authorization is expired`; run them and confirm the expected status labels fail before implementation.
- [x] 4.2 Implement a pure backup-status formatter and use it in Claude project, conversation, and artifact views; verify task 4.1 passes, only verified locally-backed-up evidence receives the affirmative label, and authorization/connection is rendered separately.

## 5. Provider connections

- [x] 5.1 Add failing `src/features/social-ai-archive/connections-page.test.tsx` tests named `offers only the supplied OAuth authorization URL`, `explains when authorization is unavailable`, `does not disconnect when confirmation is cancelled`, and `disconnects the named provider exactly once after confirmation`; run them and confirm the link, explanation, and source-call assertions fail before implementation.
- [x] 5.2 Implement the capability-filtered connection-management route with redacted status, supplied-only OAuth links, readable unavailable explanations, and named `AlertDialog` disconnect confirmation; verify task 5.1 passes and fixture mode never claims provider-side revocation.

## 6. Completion and integration boundary

- [x] 6.1 Update `docs/IMPLEMENTATION_PLAN.md` to mark item 10 fixture-backed and integration-pending, naming live Edge projections, capability names, OAuth/disconnect semantics, and pagination as follow-ups; verify the documentation diff is correct because this task changes no runtime behavior.
- [x] 6.2 Run the focused new tests, then the full gate: `npm ci --legacy-peer-deps`, `npm run api:check`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`, `build-gate -- npm run build`, and `npm run audit:ui -- --fail-under 79`; inspect the final diff and verify `openspec validate add-social-ai-archive-browsing --strict` passes.
