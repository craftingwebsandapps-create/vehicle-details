export type AuditActorRole = "superadmin" | "tenant"

export type AuditApiScope = "admin" | "tenant_api"

export interface AuditLogReport {
  id: string
  occurredAt: string
  actorRole: AuditActorRole
  apiScope: AuditApiScope
  method: string
  path: string
  query: Record<string, string> | null
  pathParams: Record<string, string> | null
  statusCode: number
  durationMs: number
  ip: string | null
  userAgent: string | null
  metadata: unknown
  actorUserId: string
  actorContractorId: string | null
  actor: { name: string; email: string } | null
  contractor: { id: string; name: string; email: string } | null
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AuditLogsListResponse = {
  success: true
  data: { items: AuditLogReport[]; meta: PaginationMeta }
}

export type AuditLogDetailResponse = {
  success: true
  data: AuditLogReport
}

export type ListAdminAuditLogsParams = {
  page?: number
  limit?: number
  actorUserId?: string
  actorRole?: AuditActorRole
  apiScope?: AuditApiScope
  method?: string
  statusCode?: number
  pathContains?: string
  from?: string
  to?: string
}
