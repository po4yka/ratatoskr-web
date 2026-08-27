import type {
  LocalBackupStatus,
  LocalEvidence,
} from "@/features/social-ai-archive/archive-source"

export function backupStatusLabel(
  evidence: LocalEvidence,
  status: LocalBackupStatus
): string {
  return evidence === "verified" && status === "locally_backed_up"
    ? "Locally backed up · verified evidence"
    : "Reference only"
}
