export type DashboardCountStat = {
  total: number
  active: number
  inactive: number
}

export type DashboardUtilization = {
  driverUtilizationPercent: number
  vehicleUtilizationPercent: number
}

export type DashboardData = {
  contractors: DashboardCountStat
  users: DashboardCountStat
  usersByRole: Record<string, number>
  drivers: DashboardCountStat
  vehicles: DashboardCountStat
  sites: DashboardCountStat
  workTypes: DashboardCountStat
  assignments: DashboardCountStat
  unassignedDrivers: number
  unassignedVehicles: number
  utilization: DashboardUtilization
  recentAssignmentsThisWeek: number
}

export type DashboardApiResponse = {
  success: boolean
  message: string
  data: DashboardData
}
