import type { components } from "@/api/generated/schema"

type CapabilityDocument = components["schemas"]["CapabilityDocument"]

/** Build a document with exactly the given capability names, sorted like Platform sends them. */
function documentOf(capabilities: string[]): CapabilityDocument {
  return {
    api_version: "1",
    capabilities: [...capabilities].sort(),
    minimum_client_versions: { web: "0.0.1", mobile: "0.0.1" },
  }
}

/**
 * A deployment where every capability this client knows is on.
 */
export const fullDeployment = documentOf([
  "content.submit",
  "github.catalog",
  "ai.archive.chatgpt",
  "ai.archive.claude",
  "connections.providers",
  "social.instagram",
  "social.threads",
  "social.x",
  "telegram.mini_app",
  "vault.git",
])

/**
 * A deployment that answers, but offers nothing.
 */
export const emptyDeployment = documentOf([])

/**
 * A partial deployment: capture is possible, Telegram sign-in is not.
 */
export const captureOnlyDeployment = documentOf(["content.submit"])

/**
 * The other partial: Telegram sign-in without capture.
 */
export const telegramOnlyDeployment = documentOf(["telegram.mini_app"])

/**
 * Names this client has never heard of, alongside a familiar one. Per the
 * contract an unfamiliar name names a feature this client does not implement,
 * so it must decide nothing.
 */
export const unfamiliarExtras = documentOf([
  "content.submit",
  "calendar.read",
  "search.web",
])
