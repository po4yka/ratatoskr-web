export const readerPreferencesKey = "ratatoskr.reader.preferences.v1"

export interface ReaderPreferences {
  fontScale: "default" | "large" | "xlarge"
  lineHeight: "comfortable" | "relaxed"
  measure: "narrow" | "comfortable"
  theme: "system" | "sepia"
  fontFamily: "geist" | "serif"
}

const defaults: ReaderPreferences = {
  fontScale: "default",
  lineHeight: "comfortable",
  measure: "comfortable",
  theme: "system",
  fontFamily: "geist",
}

const allowed: {
  [Key in keyof ReaderPreferences]: readonly ReaderPreferences[Key][]
} = {
  fontScale: ["default", "large", "xlarge"],
  lineHeight: ["comfortable", "relaxed"],
  measure: ["narrow", "comfortable"],
  theme: ["system", "sepia"],
  fontFamily: ["geist", "serif"],
}

function isPreferences(value: unknown): value is ReaderPreferences {
  if (!value || typeof value !== "object") return false
  const candidate = value as Record<string, unknown>
  return (Object.keys(allowed) as (keyof ReaderPreferences)[]).every(
    (key) =>
      typeof candidate[key] === "string" &&
      allowed[key].includes(candidate[key] as never)
  )
}

export function readReaderPreferences(): ReaderPreferences {
  try {
    const stored = localStorage.getItem(readerPreferencesKey)
    const parsed: unknown = stored ? JSON.parse(stored) : null
    return isPreferences(parsed) ? parsed : defaults
  } catch {
    return defaults
  }
}

export function writeReaderPreferences(preferences: ReaderPreferences): void {
  localStorage.setItem(readerPreferencesKey, JSON.stringify(preferences))
}
