# Web implementation plan

1. ~~Scaffold the project with lint, typecheck, test, build, and `ci.yml`.~~ Done. React 19,
   TypeScript 6, Vite 8, Tailwind 4, shadcn/ui on Base UI, ESLint, Prettier, Vitest. CSP is not
   set yet: it belongs with the first served page, not with the build.
2. Generate API types from the pinned contract and fail the build on drift.
3. Build the fetch gateway: refresh, retry, error normalization, and query keys.
4. Implement session boot, the protected shell, sign-out, and the unauthorized state.
5. Implement capability discovery and the gating rules that follow from it.
6. Implement search and the article reader with provenance and warnings.
7. Add collections and tags.
8. Add capture by URL and operation tracking with streaming and polling recovery.
9. Add the GitHub catalog and Git Vault views, including restore verification evidence.
10. Add social and AI-archive browsing with truthful provenance.
11. Add settings: sessions, devices, provider accounts, and revocation.
12. Add operational views, the public status page, accessibility hardening, and workspace
    end-to-end tests.

Definition of Done: the client reaches only the Edge API; generated types match the pinned contract;
capability gating is server-driven; every added view has its loading, empty, partial, error,
unauthorized, and offline states; provenance and verification are truthful; destructive actions are
confirmed and idempotent; no user content reaches telemetry; keyboard and contrast hold in both
themes; and the repository and workspace tests pass.
