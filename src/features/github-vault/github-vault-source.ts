export type RepositoryState = "starred" | "tracked" | "ignored"
export type MirrorHealth = "healthy" | "degraded" | "failed"
export type DrillOutcome = "passed" | "failed"

export interface RepositoryAnalysis {
  readonly analyzedAt: string
  readonly revisionDigest: string
  readonly summary: string
}

export interface GitHubRepository {
  readonly description: string
  readonly forks: number
  readonly fullName: string
  readonly id: string
  readonly language: string
  readonly state: RepositoryState
  readonly stars: number
  readonly updatedAt: string
  readonly analysis?: RepositoryAnalysis
}

export interface RestoreDrill {
  readonly completedAt: string
  readonly durationMs: number
  readonly outcome: DrillOutcome
  readonly startedAt: string
}

export interface VaultSnapshot {
  readonly createdAt: string
  readonly id: string
  readonly manifestDigest: string
}

export interface VaultMirror {
  readonly health: MirrorHealth
  readonly id: string
  readonly lastMirroredAt: string
  readonly repositoryName: string
  readonly restoreDrill?: RestoreDrill
  readonly snapshots: readonly VaultSnapshot[]
}

export interface GitHubVaultSnapshot {
  readonly authorizationUrl?: string
  readonly connected: boolean
  readonly integration: "fixture"
  readonly mirrors: readonly VaultMirror[]
  readonly repositories: readonly GitHubRepository[]
}

export type CatalogCommand =
  | {
      readonly kind: "set-starred"
      readonly repositoryId: string
      readonly value: boolean
    }
  | {
      readonly kind: "set-tracked"
      readonly repositoryId: string
      readonly value: boolean
    }

export interface GitHubVaultSource {
  connectPat(token: string): Promise<GitHubVaultSnapshot>
  read(): Promise<GitHubVaultSnapshot>
  mutate(command: CatalogCommand): Promise<GitHubVaultSnapshot>
}

export const fixtureGitHubVaultSnapshot: GitHubVaultSnapshot = {
  integration: "fixture",
  connected: false,
  authorizationUrl: "https://edge.example/oauth/github/authorize?flow=pkce",
  repositories: [
    {
      id: "ratatoskr-web",
      fullName: "ratatoskr/ratatoskr-web",
      description: "Browser reader and archive administration client.",
      language: "TypeScript",
      stars: 42,
      forks: 8,
      updatedAt: "2026-08-27T06:00:00Z",
      state: "tracked",
      analysis: {
        analyzedAt: "2026-08-26T14:12:00Z",
        revisionDigest: "sha256:79bce7a9b619c42e",
        summary:
          "Public API boundaries and client-side custody are documented.",
      },
    },
    {
      id: "archive-fixtures",
      fullName: "ratatoskr/archive-fixtures",
      description: "Bounded fixtures for archive-client contract tests.",
      language: "TypeScript",
      stars: 11,
      forks: 1,
      updatedAt: "2026-08-25T09:30:00Z",
      state: "starred",
    },
    {
      id: "legacy-ignored",
      fullName: "ratatoskr/legacy-ignored",
      description:
        "Archived fixture set excluded from catalog synchronization.",
      language: "Markdown",
      stars: 0,
      forks: 0,
      updatedAt: "2026-08-18T11:45:00Z",
      state: "ignored",
    },
  ],
  mirrors: [
    {
      id: "mirror-ratatoskr-web",
      repositoryName: "ratatoskr/ratatoskr-web",
      health: "healthy",
      lastMirroredAt: "2026-08-27T06:02:00Z",
      snapshots: [
        {
          id: "snapshot-web-20260827",
          createdAt: "2026-08-27T06:02:00Z",
          manifestDigest: "sha256:5d11b3b68dfe9a80",
        },
      ],
      restoreDrill: {
        outcome: "passed",
        startedAt: "2026-08-27T06:10:00Z",
        completedAt: "2026-08-27T06:11:14Z",
        durationMs: 74000,
      },
    },
    {
      id: "mirror-archive-fixtures",
      repositoryName: "ratatoskr/archive-fixtures",
      health: "degraded",
      lastMirroredAt: "2026-08-26T20:31:00Z",
      snapshots: [
        {
          id: "snapshot-fixtures-20260826",
          createdAt: "2026-08-26T20:31:00Z",
          manifestDigest: "sha256:aa017f7e35d6b8ce",
        },
      ],
      restoreDrill: {
        outcome: "failed",
        startedAt: "2026-08-26T20:40:00Z",
        completedAt: "2026-08-26T20:40:09Z",
        durationMs: 9000,
      },
    },
  ],
}

export function createFixtureGitHubVaultSource(
  initial: GitHubVaultSnapshot = fixtureGitHubVaultSnapshot
): GitHubVaultSource {
  let snapshot = initial
  return {
    async connectPat(token) {
      if (!token.trim()) throw new Error("A personal access token is required.")
      snapshot = { ...snapshot, connected: true }
      return snapshot
    },
    async read() {
      return snapshot
    },
    async mutate(command) {
      snapshot = {
        ...snapshot,
        repositories: updateRepository(snapshot.repositories, command),
      }
      return snapshot
    },
  }
}

export const fixtureGitHubVaultSource = createFixtureGitHubVaultSource()

function updateRepository(
  repositories: readonly GitHubRepository[],
  command: CatalogCommand
): readonly GitHubRepository[] {
  return repositories.map((repository) => {
    if (repository.id !== command.repositoryId) return repository
    if (command.kind === "set-starred") {
      return { ...repository, state: command.value ? "starred" : "ignored" }
    }
    return { ...repository, state: command.value ? "tracked" : "ignored" }
  })
}
