/* eslint-disable max-lines -- The bounded fixture is the reviewed integration boundary. */

export type SocialProvider = "x" | "instagram" | "threads"
export type AiProvider = "chatgpt" | "claude"
export type Provider = SocialProvider | AiProvider

export type LocalEvidence = "missing" | "quarantined" | "verified"
export type LocalBackupStatus = "locally_backed_up" | "reference_only"
export type Acquisition = "bookmark_snapshot" | "explicit_capture" | "import"

export interface SocialPost {
  readonly author: string
  readonly documentId?: string
  readonly folderId?: string
  readonly id: string
  readonly provider: SocialProvider
  readonly provenance: Acquisition
  readonly text: string
}

export interface SocialFolder {
  readonly id: string
  readonly label: string
  readonly provider: SocialProvider
}

export interface ArchiveMessage {
  readonly contentParts: readonly ArchiveContentPart[]
  readonly id: string
  readonly role: "assistant" | "user"
}

export type ArchiveContentPart =
  | { readonly kind: "attachment"; readonly label: string }
  | { readonly kind: "code"; readonly text: string }
  | { readonly kind: "text"; readonly text: string }

export interface ArchiveConversation {
  readonly id: string
  readonly messages: readonly ArchiveMessage[]
  readonly projectId?: string
  readonly provider: AiProvider
  readonly title: string
}

export interface ArchiveImport {
  readonly completeness: ArchiveCompleteness
  readonly id: string
  readonly outcome: "imported" | "partial"
  readonly provider: AiProvider
}

export interface ArchiveCompleteness {
  readonly gaps: readonly string[]
  readonly status: "complete" | "incomplete"
}

export interface ArchiveProject {
  readonly conversationIds: readonly string[]
  readonly evidence: LocalEvidence
  readonly id: string
  readonly provider: AiProvider
  readonly status: LocalBackupStatus
  readonly title: string
}

export interface ArchiveArtifact {
  readonly evidence: LocalEvidence
  readonly id: string
  readonly provider: "claude"
  readonly status: LocalBackupStatus
  readonly title: string
  readonly versions: readonly ArchiveArtifactVersion[]
}

export interface ArchiveArtifactVersion {
  readonly createdAt: string
  readonly id: string
  readonly label: string
}

export interface ProviderConnection {
  readonly authorizationStatus: "expired" | "valid"
  readonly authorizationUrl?: string
  readonly connected: boolean
  readonly provider: Provider
}

export interface SocialAiArchiveSnapshot {
  readonly integration: "fixture"
  readonly artifacts: readonly ArchiveArtifact[]
  readonly posts: readonly SocialPost[]
  readonly folders: readonly SocialFolder[]
  readonly imports: readonly ArchiveImport[]
  readonly conversations: readonly ArchiveConversation[]
  readonly projects: readonly ArchiveProject[]
  readonly connections: readonly ProviderConnection[]
}

export interface SocialAiArchiveSource {
  disconnect(provider: Provider): Promise<SocialAiArchiveSnapshot>
  read(): Promise<SocialAiArchiveSnapshot>
}

export const fixtureSocialAiArchiveSnapshot: SocialAiArchiveSnapshot = {
  integration: "fixture",
  folders: [{ id: "x-reading", label: "Reading", provider: "x" }],
  posts: [
    {
      id: "x-bookmark",
      provider: "x",
      author: "archive-reader",
      text: "A saved post with an extracted article.",
      provenance: "bookmark_snapshot",
      folderId: "x-reading",
      documentId: "document-contracts",
    },
    {
      id: "x-import",
      provider: "x",
      author: "export-owner",
      text: "A post not in a folder.",
      provenance: "import",
    },
    {
      id: "instagram-capture",
      provider: "instagram",
      author: "archive-owner",
      text: "An explicit capture remains distinct from a bookmark.",
      provenance: "explicit_capture",
    },
    {
      id: "threads-import",
      provider: "threads",
      author: "export-owner",
      text: "An imported Threads post has no inferred article.",
      provenance: "import",
    },
  ],
  imports: [
    {
      id: "chatgpt-export-1",
      provider: "chatgpt",
      outcome: "imported",
      completeness: { status: "complete", gaps: [] },
    },
    {
      id: "claude-export-1",
      provider: "claude",
      outcome: "partial",
      completeness: { status: "incomplete", gaps: ["missing_file"] },
    },
  ],
  projects: [
    {
      id: "claude-project-reader",
      provider: "claude",
      title: "Reader design",
      conversationIds: ["claude-conversation-1"],
      evidence: "missing",
      status: "reference_only",
    },
  ],
  conversations: [
    {
      id: "chatgpt-conversation-1",
      provider: "chatgpt",
      title: "Document import review",
      messages: [
        {
          id: "chatgpt-message-1",
          role: "user",
          contentParts: [{ kind: "text", text: "Show the import result." }],
        },
        {
          id: "chatgpt-message-2",
          role: "assistant",
          contentParts: [
            { kind: "text", text: "The export was preserved." },
            { kind: "code", text: "status = 'imported'" },
            { kind: "attachment", label: "import-manifest.json" },
          ],
        },
      ],
    },
    {
      id: "claude-conversation-1",
      provider: "claude",
      projectId: "claude-project-reader",
      title: "Archive reading surface",
      messages: [
        {
          id: "claude-message-1",
          role: "assistant",
          contentParts: [{ kind: "text", text: "Project conversation." }],
        },
      ],
    },
  ],
  artifacts: [
    {
      id: "claude-artifact-reader",
      provider: "claude",
      title: "Reader implementation",
      evidence: "verified",
      status: "locally_backed_up",
      versions: [
        {
          id: "reader-v1",
          label: "Version 1",
          createdAt: "2026-08-26T10:00:00Z",
        },
        {
          id: "reader-v2",
          label: "Version 2",
          createdAt: "2026-08-27T10:00:00Z",
        },
      ],
    },
  ],
  connections: [
    {
      provider: "x",
      connected: true,
      authorizationStatus: "valid",
      authorizationUrl: "https://edge.example/oauth/x/authorize",
    },
    {
      provider: "claude",
      connected: true,
      authorizationStatus: "expired",
    },
  ],
}

export function createFixtureSocialAiArchiveSource(
  initial: SocialAiArchiveSnapshot = fixtureSocialAiArchiveSnapshot
): SocialAiArchiveSource {
  let snapshot = initial
  return {
    async read() {
      return snapshot
    },
    async disconnect(provider) {
      snapshot = {
        ...snapshot,
        connections: snapshot.connections.map((connection) =>
          connection.provider === provider
            ? { ...connection, connected: false }
            : connection
        ),
      }
      return snapshot
    },
  }
}

export const fixtureSocialAiArchiveSource = createFixtureSocialAiArchiveSource()
