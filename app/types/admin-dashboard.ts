/** GET /api/admin/dashboard — superadmin-only aggregated counts */

export type AdminDashboardApprovalSplit = {
  total: number
  pending: number
  approved: number
  rejected: number
}

export type AdminDashboardUsersSplit = {
  total: number
  tenantUsers: number
  superadminUsers: number
}

export type AdminDashboardData = {
  contractors: number
  users: AdminDashboardUsersSplit
  workTypes: number
  vehicles: AdminDashboardApprovalSplit
  sites: AdminDashboardApprovalSplit
  drivers: AdminDashboardApprovalSplit
  activeDriverAssignments: number
}
