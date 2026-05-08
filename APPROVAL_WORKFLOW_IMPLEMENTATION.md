# Approval Workflow Implementation Guide

## Quick Start

This document outlines the technical implementation steps to integrate the approval workflow design into the contractor frontend.

---

## Phase 1: Type System Updates

### 1.1 Update Driver Types

**File**: `types/driver.ts`

```typescript
export type DriverStatus = "ACTIVE" | "INACTIVE"

export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED"
export type EntityStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "MAINTENANCE"

// Admin feedback structure
export type AdminFeedback = {
  field: string
  feedback: string
  suggestion?: string
}

// Review history item
export type ReviewHistoryItem = {
  status: ApprovalStatus
  date: string
  adminName: string
  remarks?: string
}

// Submission history item
export type SubmissionHistoryItem = {
  submissionNumber: number
  submittedAt: string
  approvalStatus: ApprovalStatus
  adminFeedback?: string
}

// Approval request details
export type ApprovalRequest = {
  status: ApprovalStatus
  remarks?: string           // admin feedback for CHANGES_REQUESTED
  reason?: string            // rejection reason for REJECTED
  requestedChanges?: AdminFeedback[]
  submissionHistory?: SubmissionHistoryItem[]
  reviewHistory?: ReviewHistoryItem[]
}

export type Driver = {
  id: string
  name: string
  licenceNumber: string
  mobileNumber: string
  status: DriverStatus           // ACTIVE | INACTIVE (entity operational state)
  approvalStatus: ApprovalStatus // approval workflow state
  licenceUrl?: string
  contractor?: {
    id: string
    name: string
  }
  site?: {
    id: string
    name: string
    location?: string
  }
  vehicle?: {
    id: string
    name: string
    registrationNumber?: string
  }
  approvalRequest?: ApprovalRequest
  createdAt?: string
  updatedAt?: string
  approvedAt?: string
}

// List response meta
export type DriverMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export type DriverListResponse = {
  success: boolean
  message: string
  data: {
    data: Driver[]
    meta: DriverMeta
  }
}

// List params with approval filtering
export type ListDriversParams = {
  approvalStatus?: ApprovalStatus | ApprovalStatus[]
  entityStatus?: EntityStatus | EntityStatus[]
  reviewActionRequired?: boolean
  hasAdminRemarks?: boolean
  resubmissionRequired?: boolean
  submittedBy?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  sortBy?: "createdAt" | "updatedAt" | "approvedAt"
  sortOrder?: "asc" | "desc"
  page?: number
  limit?: number
}
```

### 1.2 Similar Updates for Vehicle & Site Types

Apply the same pattern to:
- `types/vehicle.ts`: Add ApprovalStatus, ApprovalRequest, ListVehiclesParams
- `features/sites/types.ts`: Add ApprovalStatus, ApprovalRequest, ListSitesParams

---

## Phase 2: API Layer Updates

### 2.1 Update Driver API

**File**: `features/drivers/api.ts`

```typescript
import type { ListDriversParams } from "~/types/driver"

// Helper: convert params to query string
const buildListQuery = (params: ListDriversParams): URLSearchParams => {
  const query = new URLSearchParams()

  if (params.approvalStatus) {
    const statuses = Array.isArray(params.approvalStatus)
      ? params.approvalStatus
      : [params.approvalStatus]
    statuses.forEach(s => query.append("approvalStatus", s))
  }

  if (params.entityStatus) {
    const statuses = Array.isArray(params.entityStatus)
      ? params.entityStatus
      : [params.entityStatus]
    statuses.forEach(s => query.append("entityStatus", s))
  }

  if (params.reviewActionRequired !== undefined) {
    query.set("reviewActionRequired", String(params.reviewActionRequired))
  }

  if (params.hasAdminRemarks !== undefined) {
    query.set("hasAdminRemarks", String(params.hasAdminRemarks))
  }

  if (params.resubmissionRequired !== undefined) {
    query.set("resubmissionRequired", String(params.resubmissionRequired))
  }

  if (params.submittedBy) {
    query.set("submittedBy", params.submittedBy)
  }

  if (params.dateFrom) {
    query.set("dateFrom", params.dateFrom)
  }

  if (params.dateTo) {
    query.set("dateTo", params.dateTo)
  }

  if (params.search) {
    query.set("search", params.search)
  }

  if (params.sortBy) {
    query.set("sortBy", params.sortBy)
  }

  if (params.sortOrder) {
    query.set("sortOrder", params.sortOrder)
  }

  if (params.page) {
    query.set("page", String(params.page))
  }

  if (params.limit) {
    query.set("limit", String(params.limit))
  }

  return query
}

// Updated list function with approval filtering
export const listDrivers = async (
  params: ListDriversParams = {}
): Promise<{ items: Driver[]; meta: DriverMeta }> => {
  const accessToken = getAuthToken()
  const query = buildListQuery(params)

  const response = await apiClient.getWithAuth<DriverListResponse>(
    `${CONTRACTOR_V1_PREFIX}/drivers?${query.toString()}`,
    accessToken
  )

  if (!response.success) {
    throw new Error(response.message || "Unable to fetch drivers")
  }

  return {
    items: response.data.data.map(toDriver),
    meta: response.data.meta as DriverMeta,
  }
}

// Helper: only approved & active (for operations)
export const listAvailableDrivers = async (
  params: Omit<ListDriversParams, "approvalStatus" | "entityStatus"> = {}
): Promise<{ items: Driver[]; meta: DriverMeta }> => {
  return listDrivers({
    ...params,
    approvalStatus: "APPROVED",
    entityStatus: "ACTIVE",
  })
}

// Helper: pending approvals
export const listPendingApprovals = async (
  params: Omit<ListDriversParams, "approvalStatus"> = {}
): Promise<{ items: Driver[]; meta: DriverMeta }> => {
  return listDrivers({
    ...params,
    approvalStatus: "PENDING_APPROVAL",
  })
}

// Helper: action required
export const listActionRequired = async (
  params: Omit<ListDriversParams, "reviewActionRequired"> = {}
): Promise<{ items: Driver[]; meta: DriverMeta }> => {
  return listDrivers({
    ...params,
    reviewActionRequired: true,
  })
}
```

---

## Phase 3: Redux State Updates

### 3.1 Update Drivers Slice

**File**: `features/drivers/driversSlice.ts`

```typescript
import type { ListDriversParams } from "~/types/driver"

interface DriversState {
  items: Driver[]
  currentPage: number
  hasNextPage: boolean
  status: "idle" | "loading" | "error"
  loadMoreStatus: "idle" | "loading" | "error"
  error: string | null

  // Approval-specific state
  pendingApprovals: Driver[]
  actionRequired: Driver[]
  rejected: Driver[]
  changesRequested: Driver[]
  pendingStatus: "idle" | "loading" | "error"
  actionRequiredStatus: "idle" | "loading" | "error"
}

// Thunk: fetch with approval filtering
export const fetchDriversThunk = createAsyncThunk(
  "drivers/fetchDrivers",
  async (params?: ListDriversParams) => {
    // Default: show approved & active
    const response = await listDrivers({
      approvalStatus: "APPROVED",
      entityStatus: "ACTIVE",
      page: 1,
      limit: 50,
      ...params,
    })
    return response
  }
)

// Thunk: fetch pending approvals
export const fetchPendingApprovalsThunk = createAsyncThunk(
  "drivers/fetchPendingApprovals",
  async (params?: Omit<ListDriversParams, "approvalStatus">) => {
    const response = await listPendingApprovals({
      page: 1,
      limit: 50,
      ...params,
    })
    return response
  }
)

// Thunk: fetch action required
export const fetchActionRequiredThunk = createAsyncThunk(
  "drivers/fetchActionRequired",
  async (params?: Omit<ListDriversParams, "reviewActionRequired">) => {
    const response = await listActionRequired({
      page: 1,
      limit: 50,
      ...params,
    })
    return response
  }
)

const driversSlice = createSlice({
  name: "drivers",
  initialState,
  reducers: {
    resetPendingApprovals: (state) => {
      state.pendingApprovals = []
    },
    resetActionRequired: (state) => {
      state.actionRequired = []
    },
  },
  extraReducers: (builder) => {
    // Handle fetchDriversThunk
    builder
      .addCase(fetchDriversThunk.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchDriversThunk.fulfilled, (state, action) => {
        state.status = "idle"
        state.items = action.payload.items
        state.currentPage = action.payload.meta.page
        state.hasNextPage = action.payload.meta.hasNextPage
      })
      .addCase(fetchDriversThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.error.message || "Failed to fetch drivers"
      })

    // Handle fetchPendingApprovalsThunk
    builder
      .addCase(fetchPendingApprovalsThunk.pending, (state) => {
        state.pendingStatus = "loading"
      })
      .addCase(fetchPendingApprovalsThunk.fulfilled, (state, action) => {
        state.pendingStatus = "idle"
        state.pendingApprovals = action.payload.items
      })
      .addCase(fetchPendingApprovalsThunk.rejected, (state, action) => {
        state.pendingStatus = "error"
        state.error = action.error.message || "Failed to fetch pending approvals"
      })

    // Handle fetchActionRequiredThunk
    builder
      .addCase(fetchActionRequiredThunk.pending, (state) => {
        state.actionRequiredStatus = "loading"
      })
      .addCase(fetchActionRequiredThunk.fulfilled, (state, action) => {
        state.actionRequiredStatus = "idle"
        state.actionRequired = action.payload.items
      })
      .addCase(fetchActionRequiredThunk.rejected, (state, action) => {
        state.actionRequiredStatus = "error"
        state.error = action.error.message || "Failed to fetch action required"
      })
  },
})
```

---

## Phase 4: UI Components

### 4.1 Approval Status Badge Component

**File**: `components/ui/approval-badge.tsx`

```typescript
import type { ApprovalStatus } from "~/types/driver"
import { Badge } from "~/components/ui/badge"

interface ApprovalBadgeProps {
  status: ApprovalStatus
  className?: string
}

const statusStyles: Record<ApprovalStatus, string> = {
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CHANGES_REQUESTED: "bg-orange-100 text-orange-800",
}

const statusLabels: Record<ApprovalStatus, string> = {
  PENDING_APPROVAL: "⏳ Awaiting Review",
  APPROVED: "✅ Approved",
  REJECTED: "❌ Rejected",
  CHANGES_REQUESTED: "🔴 Changes Required",
}

export function ApprovalBadge({ status, className }: ApprovalBadgeProps) {
  return (
    <Badge className={`${statusStyles[status]} ${className || ""}`}>
      {statusLabels[status]}
    </Badge>
  )
}
```

### 4.2 Entity Status Badge Component

**File**: `components/ui/entity-status-badge.tsx`

```typescript
import type { EntityStatus } from "~/types/driver"
import { Badge } from "~/components/ui/badge"

interface EntityStatusBadgeProps {
  status: EntityStatus
  className?: string
}

const statusStyles: Record<EntityStatus, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
  MAINTENANCE: "bg-purple-100 text-purple-800",
}

const statusLabels: Record<EntityStatus, string> = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  MAINTENANCE: "MAINTENANCE",
}

export function EntityStatusBadge({ status, className }: EntityStatusBadgeProps) {
  return (
    <Badge className={`${statusStyles[status]} ${className || ""}`}>
      {statusLabels[status]}
    </Badge>
  )
}
```

### 4.3 Admin Feedback Panel

**File**: `components/approval/AdminFeedbackPanel.tsx`

```typescript
import type { ApprovalRequest } from "~/types/driver"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

interface AdminFeedbackPanelProps {
  approvalRequest?: ApprovalRequest
}

export function AdminFeedbackPanel({ approvalRequest }: AdminFeedbackPanelProps) {
  if (!approvalRequest) {
    return null
  }

  if (approvalRequest.status === "APPROVED") {
    return (
      <Card className="mb-4">
        <CardHeader className="bg-green-50 border-b">
          <CardTitle className="text-sm">✅ Approved</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600">
            Approved on {new Date(approvalRequest.reviewHistory?.[0]?.date || "").toLocaleDateString()}
            {approvalRequest.reviewHistory?.[0]?.adminName && ` by ${approvalRequest.reviewHistory[0].adminName}`}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (approvalRequest.status === "REJECTED") {
    return (
      <Card className="mb-4 border-red-200 bg-red-50">
        <CardHeader className="bg-red-100 border-b border-red-200">
          <CardTitle className="text-sm text-red-800">❌ Rejected</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Reason</p>
              <p className="text-sm text-gray-800 mt-1">{approvalRequest.reason}</p>
            </div>
            {approvalRequest.remarks && (
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Admin Notes</p>
                <p className="text-sm text-gray-800 mt-1">{approvalRequest.remarks}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (approvalRequest.status === "CHANGES_REQUESTED") {
    return (
      <Card className="mb-4 border-orange-200 bg-orange-50">
        <CardHeader className="bg-orange-100 border-b border-orange-200">
          <CardTitle className="text-sm text-orange-800">🔴 Changes Requested</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {approvalRequest.remarks && (
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Admin Feedback</p>
              <p className="text-sm text-gray-800 mt-1">{approvalRequest.remarks}</p>
            </div>
          )}

          {approvalRequest.requestedChanges && approvalRequest.requestedChanges.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Requested Changes</p>
              <div className="space-y-2">
                {approvalRequest.requestedChanges.map((change, idx) => (
                  <div key={idx} className="bg-white p-2 rounded border border-orange-200">
                    <p className="text-xs font-semibold text-gray-700">{change.field}</p>
                    <p className="text-sm text-gray-700 mt-1">{change.feedback}</p>
                    {change.suggestion && (
                      <p className="text-xs text-gray-600 mt-1">
                        💡 Suggestion: {change.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (approvalRequest.status === "PENDING_APPROVAL") {
    return (
      <Card className="mb-4 border-yellow-200 bg-yellow-50">
        <CardHeader className="bg-yellow-100 border-b border-yellow-200">
          <CardTitle className="text-sm text-yellow-800">⏳ Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600">
            Submitted on {new Date(approvalRequest.submissionHistory?.[0]?.submittedAt || "").toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    )
  }

  return null
}
```

### 4.4 Filter Component

**File**: `components/approval/ApprovalFilterBar.tsx`

```typescript
import { useState } from "react"
import type { ApprovalStatus, EntityStatus, ListDriversParams } from "~/types/driver"
import { Button } from "~/components/ui/button"
import { Select } from "~/components/ui/select"
import { Input } from "~/components/ui/input"
import { DatePickerField } from "~/components/form"

interface ApprovalFilterBarProps {
  onFilter: (params: ListDriversParams) => void
  isLoading?: boolean
}

const APPROVAL_STATUS_OPTIONS: { label: string; value: ApprovalStatus }[] = [
  { label: "All Approval Status", value: "" as ApprovalStatus },
  { label: "Pending Approval", value: "PENDING_APPROVAL" },
  { label: "Approved", value: "APPROVED" },
  { label: "Changes Requested", value: "CHANGES_REQUESTED" },
  { label: "Rejected", value: "REJECTED" },
]

const ENTITY_STATUS_OPTIONS: { label: string; value: EntityStatus }[] = [
  { label: "All Entity Status", value: "" as EntityStatus },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Maintenance", value: "MAINTENANCE" },
]

export function ApprovalFilterBar({ onFilter, isLoading }: ApprovalFilterBarProps) {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | "">("")
  const [entityStatus, setEntityStatus] = useState<EntityStatus | "">("")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const handleApply = () => {
    const params: ListDriversParams = {
      page: 1,
      limit: 50,
    }

    if (approvalStatus) params.approvalStatus = approvalStatus
    if (entityStatus) params.entityStatus = entityStatus
    if (search) params.search = search
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo

    onFilter(params)
  }

  return (
    <div className="bg-white p-4 rounded border space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={approvalStatus}
          onValueChange={(val) => setApprovalStatus(val as ApprovalStatus)}
          label="Approval Status"
          options={APPROVAL_STATUS_OPTIONS}
        />
        <Select
          value={entityStatus}
          onValueChange={(val) => setEntityStatus(val as EntityStatus)}
          label="Entity Status"
          options={ENTITY_STATUS_OPTIONS}
        />
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, mobile, license..."
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To"
        />
      </div>

      <Button onClick={handleApply} disabled={isLoading}>
        Apply Filters
      </Button>
    </div>
  )
}
```

---

## Phase 5: Page Implementation

### 5.1 Updated Drivers Page

**File**: `pages/mobile/Drivers.tsx` (updated structure)

```typescript
import { useState } from "react"
import type { ListDriversParams } from "~/types/driver"

export default function Drivers() {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<
    "approved" | "pending" | "action-required" | "rejected"
  >("approved")
  const [filterParams, setFilterParams] = useState<ListDriversParams>({
    page: 1,
    limit: 50,
  })

  useEffect(() => {
    if (activeTab === "approved") {
      dispatch(fetchDriversThunk(filterParams))
    } else if (activeTab === "pending") {
      dispatch(fetchPendingApprovalsThunk(filterParams))
    } else if (activeTab === "action-required") {
      dispatch(fetchActionRequiredThunk(filterParams))
    } else if (activeTab === "rejected") {
      dispatch(fetchDriversThunk({ ...filterParams, approvalStatus: "REJECTED" }))
    }
  }, [activeTab, filterParams, dispatch])

  return (
    <div className="space-y-3 pb-20">
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto">
        <TabButton active={activeTab === "approved"} onClick={() => setActiveTab("approved")}>
          Approved
        </TabButton>
        <TabButton active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>
          Pending {pendingCount > 0 && <Badge>{pendingCount}</Badge>}
        </TabButton>
        <TabButton active={activeTab === "action-required"} onClick={() => setActiveTab("action-required")}>
          Action Required {actionRequiredCount > 0 && <Badge variant="destructive">{actionRequiredCount}</Badge>}
        </TabButton>
        <TabButton active={activeTab === "rejected"} onClick={() => setActiveTab("rejected")}>
          Rejected {rejectedCount > 0 && <Badge variant="destructive">{rejectedCount}</Badge>}
        </TabButton>
      </div>

      {/* Filter Bar */}
      {activeTab === "approved" && (
        <ApprovalFilterBar
          onFilter={(params) => setFilterParams(params)}
          isLoading={status === "loading"}
        />
      )}

      {/* List */}
      {status === "loading" && <OpsListSkeleton />}

      {status === "idle" && items.length === 0 && (
        <OpsEmptyState title="No drivers found" />
      )}

      {items.map((driver) => (
        <DriverCard
          key={driver.id}
          driver={driver}
          onEdit={() => openEditDialog(driver)}
          onViewFeedback={() => openFeedbackDialog(driver)}
        />
      ))}

      {/* Load More */}
      {hasMore && <div ref={loadMoreRef} className="py-4 text-center" />}
    </div>
  )
}
```

---

## Implementation Checklist

- [ ] **Types**: Add ApprovalStatus, EntityStatus, ApprovalRequest to all entity types
- [ ] **API**: Update drivers, vehicles, sites API with query parameter handling
- [ ] **Redux**: Add separate slices/thunks for pending, action-required, rejected
- [ ] **Components**: Create approval badge, entity status badge, feedback panel
- [ ] **Filters**: Implement filter bar with all parameters
- [ ] **Pages**: Update Drivers, Vehicles, Sites pages with tabs
- [ ] **Testing**: Test all filter combinations
- [ ] **Documentation**: Update README with new features

---

## Notes

- All changes maintain backward compatibility with existing APPROVED + ACTIVE views
- Approval filtering is optional—defaults to APPROVED + ACTIVE for operational use
- Admin feedback panel is read-only for contractor
- Toast messages clearly communicate submission for approval workflow
