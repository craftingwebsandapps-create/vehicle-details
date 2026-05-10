import { getAccessToken } from "~/features/auth/auth-storage"
import { apiClient } from "~/services/api-client"
import type {
  Assignment,
  AssignmentApiEntity,
  AssignmentListApiResponse,
  AssignmentMeta,
  AssignmentMutationResponse,
  ChangeAssignmentDriverRequest,
  CreateAssignmentRequest,
} from "~/types/assignment"

const CONTRACTOR_V1_PREFIX = "/v1/contractor"

const getAuthToken = () => {
  const accessToken = getAccessToken()

  if (!accessToken) {
    throw new Error("Access token is required")
  }

  return accessToken
}

const toAssignment = (entity: AssignmentApiEntity): Assignment => {
  const assignmentId = entity.id ?? entity._id ?? ""
  const driverRef =
    typeof entity.driver === "string" ? undefined : entity.driver
  const vehicleRef =
    typeof entity.vehicle === "string" ? undefined : entity.vehicle

  return {
    id: assignmentId,
    driver: {
      name:
        (typeof entity.driver === "string"
          ? entity.driver
          : entity.driver?.name) ?? "Unassigned",
      licenceNumber: driverRef?.licenceNumber,
      mobileNumber: driverRef?.mobileNumber,
    },
    vehicle: {
      name:
        (typeof entity.vehicle === "string"
          ? entity.vehicle
          : entity.vehicle?.name) ?? "Unassigned",
      registrationNumber: vehicleRef?.registrationNumber,
      type: vehicleRef?.type,
    },
    status: entity.status ?? "ASSIGNED",
    assignedAt: entity.assignedAt,
    unassignedAt: entity.unassignedAt,
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

export const createAssignment = async (
  payload: CreateAssignmentRequest
): Promise<Assignment> => {
  const accessToken = getAuthToken()

  if (!payload.driver || !payload.vehicle) {
    throw new Error("Driver and vehicle are required")
  }

  const response = await apiClient.post<AssignmentMutationResponse>(
    `${CONTRACTOR_V1_PREFIX}/assignments`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to create assignment")
  }

  return toAssignment(response.data)
}

export const changeAssignmentDriver = async (
  assignmentId: string,
  payload: ChangeAssignmentDriverRequest
): Promise<Assignment> => {
  const accessToken = getAuthToken()

  if (!assignmentId || !payload.driver) {
    throw new Error("Assignment id and driver are required")
  }

  const response = await apiClient.putWithAuth<AssignmentMutationResponse>(
    `${CONTRACTOR_V1_PREFIX}/assignments/${assignmentId}/change-driver`,
    payload,
    accessToken
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to change driver")
  }

  return toAssignment(response.data)
}

export const unassignAssignment = async (
  assignmentId: string
): Promise<void> => {
  const accessToken = getAuthToken()

  if (!assignmentId) {
    throw new Error("Assignment id is required")
  }

  const response = await apiClient.request<{
    success: boolean
    message: string
  }>(`${CONTRACTOR_V1_PREFIX}/assignments/${assignmentId}/unassign`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.success) {
    throw new Error(response.message || "Unable to unassign")
  }
}
