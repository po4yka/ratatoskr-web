import type { paths } from "../generated/schema"

/** Every path this client may legally key against, straight from the contract. */
export type ContractPath = keyof paths & string

export interface QueryKeyParams {
  /** Values for the template's `{placeholders}`. */
  path?: Readonly<Record<string, string | number>>
  /** Query-string parameters, appended as one sorted entry object. */
  query?: Readonly<Record<string, string | number | boolean>>
}

/**
 * Pin a literal template to the generated contract at compile time: a path
 * that leaves `paths` stops compiling here, in every factory below.
 */
const contractTemplate = <T extends ContractPath>(template: T): T => template

const splitSegments = (template: string): string[] =>
  template.split("/").filter((segment) => segment.length > 0)

const PLACEHOLDER = /^\{([^}]+)\}$/

interface Expanded {
  template: string
  segments: unknown[]
  placeholders: Set<string>
}

function expandTemplate(
  template: string,
  path?: Readonly<Record<string, string | number>>
): Expanded {
  const placeholders = new Set<string>()
  const segments: unknown[] = splitSegments(template).map((segment) => {
    const match = PLACEHOLDER.exec(segment)
    if (match === null) return segment

    placeholders.add(match[1])
    return path?.[match[1]]
  })

  return { template, segments, placeholders }
}

/** Refuse placeholders left unfilled and parameters the template never asked for. */
function requireFilled(expanded: Expanded, params?: QueryKeyParams): void {
  const provided = Object.keys(params?.path ?? {})
  const missing = [...expanded.placeholders].filter(
    (name) => !provided.includes(name)
  )
  const unknown = provided.filter((name) => !expanded.placeholders.has(name))

  if (missing.length > 0) {
    throw new Error(
      `Query-key template ${expanded.template} is missing ${missing.join(", ")}`
    )
  }
  if (unknown.length > 0) {
    throw new Error(
      `Query-key template ${expanded.template} has no placeholder for ${unknown.join(", ")}`
    )
  }
}

function appendQuery(segments: unknown[], params?: QueryKeyParams): void {
  const query = params?.query
  if (query === undefined || Object.keys(query).length === 0) return

  // Sorted entries: insertion order can never leak into the key.
  segments.push(Object.fromEntries(Object.entries(query).sort()))
}

/**
 * Build a cache key from an API path template plus parameters, so invalidation
 * stays shaped like the API itself: `/v1/operations/{id}` keys as
 * `["v1", "operations", id]`. Identical inputs always produce deep-equal
 * keys; parameter insertion order cannot leak in.
 */
export function queryKey(
  template: ContractPath,
  params?: QueryKeyParams
): readonly unknown[] {
  const expanded = expandTemplate(template, params?.path)
  requireFilled(expanded, params)
  appendQuery(expanded.segments, params)

  return expanded.segments
}

/**
 * Named factories for today's readable endpoints. Each template literal is
 * pinned to the generated paths, so a renamed or removed contract route fails
 * the build instead of silently rotting an invalidation.
 */
export const apiKeys = {
  capabilities: () => queryKey(contractTemplate("/v1/capabilities")),

  operationsRoot: (): readonly ["v1", "operations"] => ["v1", "operations"],

  operation: (operationId: string) =>
    queryKey(contractTemplate("/v1/operations/{operation_id}"), {
      path: { operation_id: operationId },
    }),

  operationEvents: (operationId: string) =>
    queryKey(contractTemplate("/v1/operations/{operation_id}/events"), {
      path: { operation_id: operationId },
    }),
}
