import type { SearchMode, SearchState } from "@/features/search/search-state"

export interface ArchiveSearchResult {
  documentId: string
  title: string
  snippet: string
  matchExplanation: string
  tags: readonly string[]
}

export interface ArchiveSearchPage {
  modes: readonly SearchMode[]
  page: number
  pageCount: number
  results: readonly ArchiveSearchResult[]
}

export type DocumentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: readonly string[] }

export interface ArchiveDocument {
  id: string
  title: string
  sourceAddress: string
  extractionPath: string
  warnings: readonly string[]
  blocks: readonly DocumentBlock[]
  tags: readonly string[]
  analysis?: {
    tldr: string
    keyPoints: readonly string[]
  }
}

export interface ArchiveSource {
  search(state: SearchState): Promise<ArchiveSearchPage>
  read(documentId: string): Promise<ArchiveDocument | undefined>
}

const documents: readonly ArchiveDocument[] = [
  {
    id: "document-ir",
    title: "Document IR: Evidence at the Boundary",
    sourceAddress: "https://archive.example/notes/document-ir",
    extractionPath: "readability → normalized blocks",
    warnings: [
      "Navigation and footer content were excluded during extraction.",
      "The source did not declare a document language.",
    ],
    tags: ["contracts", "provenance", "reader"],
    analysis: {
      tldr: "Document IR carries the content and evidence required for a reader to qualify extracted text.",
      keyPoints: [
        "A source address and extraction path make the origin inspectable.",
        "Warnings remain attached to the rendered record.",
      ],
    },
    blocks: [
      { type: "heading", text: "A reader needs evidence" },
      {
        type: "paragraph",
        text: "Document IR keeps extracted content together with the provenance that explains how it arrived.",
      },
      {
        type: "quote",
        text: "A clean rendering must not make a degraded extraction look authoritative.",
      },
      {
        type: "list",
        items: ["Source address", "Extraction path", "Visible warnings"],
      },
    ],
  },
  {
    id: "search-evidence",
    title: "Search Results Need Match Evidence",
    sourceAddress: "https://archive.example/notes/search-evidence",
    extractionPath: "markdown import → normalized blocks",
    warnings: [],
    tags: ["search", "evidence"],
    blocks: [
      { type: "heading", text: "A result is not an answer" },
      {
        type: "paragraph",
        text: "A search row gives the reader a snippet and an explanation of why the document matched.",
      },
    ],
  },
]

function resultFor(document: ArchiveDocument): ArchiveSearchResult {
  const paragraph = document.blocks.find((block) => block.type === "paragraph")
  return {
    documentId: document.id,
    title: document.title,
    snippet: paragraph?.text ?? document.title,
    matchExplanation: "Matched document text and recorded tags.",
    tags: document.tags,
  }
}

function documentMatches(document: ArchiveDocument, query: string): boolean {
  const haystack = [
    document.title,
    ...document.tags,
    ...document.blocks.flatMap((block) =>
      block.type === "list" ? block.items : [block.text]
    ),
  ]
    .join(" ")
    .toLocaleLowerCase()

  return haystack.includes(query.toLocaleLowerCase())
}

export const fixtureArchiveSource: ArchiveSource = {
  async search(state) {
    const matches = state.query
      ? documents.filter((document) => documentMatches(document, state.query))
      : documents
    const pageCount = Math.max(1, Math.ceil(matches.length / 10))
    const page = Math.min(state.page, pageCount)

    return {
      modes: ["auto", "keyword", "semantic"],
      page,
      pageCount,
      results: matches.slice((page - 1) * 10, page * 10).map(resultFor),
    }
  },
  async read(documentId) {
    return documents.find((document) => document.id === documentId)
  },
}
