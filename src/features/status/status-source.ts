import type { Gateway } from "@/api/gateway/client"
import type { components, paths } from "@/api/generated/schema"

export type PublicStatusDocument = components["schemas"]["PublicStatusDocument"]

const STATUS_PATH: keyof paths = "/v1/status"

export interface StatusSource {
  read(signal?: AbortSignal): Promise<PublicStatusDocument>
}

/** Read the anonymous sanitized document through the same Edge boundary. */
export function createStatusSource(gateway: Gateway): StatusSource {
  return {
    async read(signal) {
      const result = await gateway.request<PublicStatusDocument>({
        path: STATUS_PATH,
        signal,
      })
      if (result === undefined) throw new Error("Status returned no document.")
      return result
    },
  }
}
