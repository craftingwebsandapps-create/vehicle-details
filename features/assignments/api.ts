import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import type {
  Assignment,
  AssignmentApiEntity,
  AssignmentListApiResponse,
  AssignmentMeta,
} from "~/types/assignment"

const CONTRACTOR_V1_PREFIX = "/v1/contractor"

const getAuthToken = () => {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("Access token is required")
  }

  return accessToken
}

const toRoute = (entity: AssignmentApiEntity) => {
  const directRoute = entity.route?.trim()

  if (directRoute) {
    return directRoute
  }

  const source =
    entity.sourceSite?.name ?? entity.source ?? entity.from ?? "Unknown source"
  const destination =
    entity.destinationSite?.name ??
    entity.destination ??
    entity.to ??
    "Unknown destination"

  return `${source} to ${destination}`
}

const toAssignment = (entity: AssignmentApiEntity): Assignment => {
  const assignmentId = entity.id ?? entity._id ?? ""
  const driverName =
    typeof entity.driver === "string"
      ? entity.driver
      : (entity.driver?.name ?? "Unassigned")
  const vehicleLabel =
    typeof entity.vehicle === "string"
      ? entity.vehicle
      : (entity.vehicle?.registrationNumber ??
        entity.vehicle?.name ??
        "Unassigned")

  return {
    id: assignmentId,
    driverName,
    vehicleLabel,
    status: entity.status ?? "ASSIGNED",
    route: toRoute(entity),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  }
}

export const listAssignments = async (
  params: { page?: number; limit?: number } = {}
): Promise<{ items: Assignment[]; meta: AssignmentMeta }> => {
  const accessToken = getAuthToken()
  const query = new URLSearchParams()

  query.set("page", String(params.page ?? 1))
  query.set("limit", String(params.limit ?? 10))

  const response = await apiClient.getWithAuth<AssignmentListApiResponse>(
    `${CONTRACTOR_V1_PREFIX}/assignments?${query.toString()}`,
    accessToken
  )

  if (!response.success || !response.data?.data) {
    throw new Error(response.message || "Unable to fetch assignments")
  }

  return {
    items: response.data.data.map(toAssignment),
    meta: response.data.meta,
  }
}
