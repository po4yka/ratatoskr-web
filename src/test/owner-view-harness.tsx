import { storeCustody } from "@/auth/custody"
import type { components } from "@/api/generated/schema"
import type { ApiError } from "@/api/gateway/errors"
import { gatewayOf, renderApp } from "@/test/app-harness"

type CapabilityDocument = components["schemas"]["CapabilityDocument"]

export const ownerCapabilities: CapabilityDocument = {
  api_version: "1",
  capabilities: [
    "platform.audit.inspect",
    "platform.operations.inspect",
    "platform.schedules.inspect",
  ],
  minimum_client_versions: { web: "0.0.1", mobile: "0.0.1" },
  services: [],
}

export const memberCapabilities: CapabilityDocument = {
  ...ownerCapabilities,
  capabilities: [],
}

export const offline: ApiError = { kind: "offline" }
export const forbidden: ApiError = { kind: "forbidden", status: 403 }
export const terminal: ApiError = { kind: "terminal", status: 504 }

export function renderOwnerView({
  path,
  response,
  capabilities = ownerCapabilities,
}: {
  path: string
  response: object | ((path: string) => Promise<unknown>)
  capabilities?: CapabilityDocument
}) {
  sessionStorage.clear()
  localStorage.clear()
  window.history.replaceState(null, "", path)
  storeCustody("owner-credential")
  const requests: string[] = []
  const gateway = gatewayOf(({ path: requestPath, query }) => {
    const suffix = query
      ? `?${new URLSearchParams(query as Record<string, string>)}`
      : ""
    requests.push(`${requestPath}${suffix}`)
    if (requestPath === "/v1/capabilities") return Promise.resolve(capabilities)
    return typeof response === "function"
      ? response(requestPath)
      : Promise.resolve(response)
  })
  return { ...renderApp({ gateway }), requests }
}
