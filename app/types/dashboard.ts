export type DashboardCountStat = {
  total: number
  pending: number
  approved: number
  rejected: number
}

export type DashboardData = {
  vehicles: DashboardCountStat
  sites: DashboardCountStat
  drivers: DashboardCountStat
  contractorId: string
  activeDriverAssignments: number
}

export type DashboardApiResponse = {
  success: boolean
  data?: DashboardData
  error?: { message?: string; code?: string }
}
