import type { components } from "@/api/generated/schema"
import type { Gateway } from "@/api/gateway/client"

export type OperationInspectionPage =
  components["schemas"]["OperationInspectionPage"]
export type ScheduleInspectionPage =
  components["schemas"]["ScheduleInspectionPage"]
export type AuditEventPage = components["schemas"]["AuditEventPage"]
export type OperationDetail = components["schemas"]["OperationSnapshot"]

export interface InspectionSource {
  operations(
    cursor: string | null,
    signal: AbortSignal
  ): Promise<OperationInspectionPage>
  schedules(
    cursor: string | null,
    signal: AbortSignal
  ): Promise<ScheduleInspectionPage>
  audit(cursor: string | null, signal: AbortSignal): Promise<AuditEventPage>
  operation(operationId: string, signal: AbortSignal): Promise<OperationDetail>
}

function queryOf(cursor: string | null): Record<string, string> {
  return cursor === null ? { limit: "20" } : { cursor, limit: "20" }
}

async function read<T>(
  gateway: Gateway,
  request: { path: string; cursor?: string | null; signal: AbortSignal }
): Promise<T> {
  const page = await gateway.request<T>({
    path: request.path,
    query: request.cursor === undefined ? undefined : queryOf(request.cursor),
    signal: request.signal,
  })
  if (page === undefined) throw { kind: "terminal", status: 502 }
  return page
}

export function createInspectionSource(gateway: Gateway): InspectionSource {
  return {
    operations: (cursor, signal) =>
      read(gateway, { path: "/v1/admin/operations", cursor, signal }),
    schedules: (cursor, signal) =>
      read(gateway, { path: "/v1/admin/schedules", cursor, signal }),
    audit: (cursor, signal) =>
      read(gateway, { path: "/v1/admin/audit-events", cursor, signal }),
    operation: (operationId, signal) =>
      read(gateway, {
        path: `/v1/admin/operations/${encodeURIComponent(operationId)}`,
        signal,
      }),
  }
}
