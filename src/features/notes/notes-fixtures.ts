import type { GatewayRequest } from "@/api/gateway/client"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"

/** How a test answers one notes or operation request. */
export type NotesResponder = (request: GatewayRequest) => unknown

export interface NotesRender {
  readonly path: string
  readonly respond: NotesResponder
  /** The capability names of the deployment; `notes.vaults` when absent. */
  readonly capabilities?: readonly string[]
}

/**
 * Mount the whole application at `path` behind a gateway double. The
 * capability document comes from here; every other request goes to the
 * test's responder, so each test states the notes routes it relies on.
 * The returned list records every request in order.
 */
export function renderNotes(options: NotesRender): GatewayRequest[] {
  window.history.replaceState(null, "", options.path)
  storeCustody("credential-1")
  const calls: GatewayRequest[] = []
  const gateway = gatewayOf(async (request) => {
    calls.push(request)
    if (request.path === "/v1/capabilities") {
      return {
        api_version: "1",
        capabilities: [...(options.capabilities ?? ["notes.vaults"])],
        minimum_client_versions: { web: "0.0.1", mobile: "0.0.1" },
        services: [],
      }
    }
    return options.respond(request)
  })
  renderApp({ gateway })
  return calls
}

/** A snapshot of the connect operation in the given status and stage. */
export function connectOperation(status: string, stage: string | null) {
  return {
    operation_id: "operation-1",
    kind: "notes.connection.connect",
    status,
    stage,
    progress_percent: null,
    status_changed_at: "2026-10-14T10:00:00Z",
    created_at: "2026-10-14T09:59:00Z",
    retryable: false,
  }
}
