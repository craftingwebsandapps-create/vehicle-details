# Contractor Approval Workflow Design

## Table of Contents
1. [Data Model & State Transitions](#data-model--state-transitions)
2. [Approval Status Definitions](#approval-status-definitions)
3. [Entity Status Definitions](#entity-status-definitions)
4. [Filtering Business Logic](#filtering-business-logic)
5. [Contractor Workflows](#contractor-workflows)
6. [Admin Workflows](#admin-workflows)
7. [Visibility & Operational Rules](#visibility--operational-rules)
8. [API Design Expectations](#api-design-expectations)
9. [Implementation Checklist](#implementation-checklist)

---

## Data Model & State Transitions

### Approval State Machine

```
┌─────────────────┐
│   NOT_EXISTS    │
└────────┬────────┘
         │ contractor creates/updates
         ↓
┌──────────────────────────┐
│  PENDING_APPROVAL (new)  │
│  - waiting admin review   │
│  - not operational        │
└────────┬────────┬────────┘
         │        │
    [APPROVE]  [REJECT]
         │        │
    [CHANGES_REQUESTED]
         ├────────┼────────┬─────────┐
         ↓        ↓        ↓         ↓
    APPROVED   REJECTED   CHANGES_REQUESTED
    (active)   (final)    (action required)
         │                     │
         │                     │ contractor modifies
         │                     ↓
         │            PENDING_APPROVAL (resubmitted)
         │                     │
         └─────────────────────┘
                (cycle continues)
```

### Entity State Machine (Operational Status)

```
ACTIVE ←→ INACTIVE (contractor toggles)
   ↓
SUSPENDED (admin action: compliance/safety)
   ↓
MAINTENANCE (planned downtime)
   ↓
ACTIVE (when resolved)
```

### Full Record State

Each record has **two independent dimensions**:
1. **Approval Status** (approval workflow): PENDING_APPROVAL, APPROVED, REJECTED, CHANGES_REQUESTED
2. **Entity Status** (operational): ACTIVE, INACTIVE, SUSPENDED, MAINTENANCE

---

## Approval Status Definitions

### PENDING_APPROVAL
**Purpose**: Waiting for initial admin review or contractor resubmission awaiting review

**Characteristics**:
- Newly created/submitted records
- Resubmitted records after changes requested
- Cannot be used operationally
- Contractor can view but cannot assign to operations
- Admin must review and take action

**Contractor Actions**:
- View submission and status
- View admin remarks (if any from previous rejection)
- Modify and resubmit
- Cannot delete

**Admin Actions**:
- Review submission
- Approve
- Reject with reason
- Request changes with suggestions
- Add remarks/feedback

**Visibility**:
- Only to submitting contractor
- Only to admins

### APPROVED
**Purpose**: Admin approved; record is operationally active

**Characteristics**:
- Admin has reviewed and approved
- Available for operational use (assignments, selections)
- Contractor can update (triggers PENDING_APPROVAL for changes)
- Can be toggled ACTIVE/INACTIVE by contractor
- Can be suspended by admin

**Contractor Actions**:
- View details
- Use for assignments
- Update (new changes go to PENDING_APPROVAL)
- Toggle ACTIVE/INACTIVE status
- Cannot delete

**Admin Actions**:
- View submission
- Suspend (compliance issue)
- View history

**Visibility**:
- Default in contractor operational lists
- Available in assignment dialogs

### REJECTED
**Purpose**: Admin rejected; contractor must address issues

**Characteristics**:
- Admin rejected due to non-compliance/invalid data
- Cannot be used operationally
- Contractor must review rejection reason
- Contractor can resubmit (creates new PENDING_APPROVAL)
- Final state—cannot be un-rejected

**Contractor Actions**:
- View rejection reason
- View admin remarks
- Create corrected version (new submission)
- Cannot directly update—must resubmit

**Admin Actions**:
- View rejection (audit trail)
- View reason given

**Visibility**:
- Show in separate "Rejected" tab/filter
- Include rejection date and reason
- Action required to address

### CHANGES_REQUESTED
**Purpose**: Admin wants contractor modifications; not a final rejection

**Characteristics**:
- Admin found issues but allows correction
- Not operationally usable until approved
- Contractor must modify and resubmit
- Admin feedback/suggestions included
- Review history maintained

**Contractor Actions**:
- View change requests and suggestions
- View admin remarks/feedback
- Modify record
- Resubmit (goes to PENDING_APPROVAL)
- Cannot delete

**Admin Actions**:
- Provide change requests with details
- Include suggestions/examples
- View contractor's modifications
- Approve after resubmission
- Can request additional changes

**Visibility**:
- Highlight as "Action Required"
- Show admin feedback prominently
- Track resubmission count

---

## Entity Status Definitions

### ACTIVE
**Purpose**: Operationally active and available

**Rules**:
- Record is usable for assignments
- Available in dropdowns/selects
- Can be assigned to operations
- Contractor toggles to/from INACTIVE
- Admin can suspend if compliance issue

### INACTIVE
**Purpose**: Contractor temporarily disabled; not for operations

**Rules**:
- Not available in dropdowns/selects
- Cannot be assigned
- Contractor-controlled (e.g., driver on leave)
- Can be reactivated anytime
- Approval status unchanged

### SUSPENDED
**Purpose**: Admin disabled due to compliance/safety issue

**Rules**:
- Admin action only
- Indicates problem (non-payment, violation, audit flag)
- Cannot be assigned
- Contractor cannot toggle—requires admin to resolve
- Requires admin action to restore

### MAINTENANCE
**Purpose**: Planned operational downtime

**Rules**:
- Equipment/vehicle maintenance window
- Cannot be assigned during maintenance
- Contractor-set with expected end date
- Auto-revert to previous status on end date (if implemented)
- Cannot be assigned

---

## Filtering Business Logic

### Filter Combinations & Rules

#### 1. Single Approval Status Filters

```
?approvalStatus=PENDING_APPROVAL
├─ Show: records awaiting admin review or contractor resubmission
├─ Use: pending inbox, awaiting action dashboard
└─ Sort: createdAt DESC (newest first)

?approvalStatus=APPROVED
├─ Show: admin-approved, operationally available records
├─ Use: operational lists, assignment dialogs
└─ Common: paired with entityStatus=ACTIVE

?approvalStatus=REJECTED
├─ Show: rejected records with reason
├─ Use: rejected items view, contractor to address
└─ Action: contractor must understand rejection

?approvalStatus=CHANGES_REQUESTED
├─ Show: records requiring contractor modifications
├─ Use: action required list, high-priority review
└─ Flag: highlight as requiring immediate action
```

#### 2. Entity Status Filters

```
?entityStatus=ACTIVE
├─ Show: operationally active
├─ Default: usually combined with approvalStatus=APPROVED
└─ Use: assignment dialogs, operational selections

?entityStatus=INACTIVE
├─ Show: contractor-disabled items
├─ Use: archived/inactive view
└─ Note: approval status still applies (e.g., APPROVED but INACTIVE)

?entityStatus=SUSPENDED
├─ Show: admin-suspended items
├─ Use: compliance review, audit trail
└─ Action: requires admin intervention

?entityStatus=MAINTENANCE
├─ Show: items in maintenance
├─ Use: equipment maintenance tracking
└─ Schedule: shows expected completion
```

#### 3. Action-Required Filters

```
?reviewActionRequired=true
├─ Show: CHANGES_REQUESTED or REJECTED records
├─ Use: contractor action dashboard
└─ Combines: approvalStatus in (CHANGES_REQUESTED, REJECTED)

?hasAdminRemarks=true
├─ Show: records with admin feedback
├─ Use: review feedback dashboard
└─ Includes: REJECTED, CHANGES_REQUESTED, APPROVED records
```

#### 4. Resubmission Filters

```
?resubmissionRequired=true
├─ Show: REJECTED or CHANGES_REQUESTED records
├─ Use: high-priority action list
└─ Action: contractor must resubmit
```

#### 5. Date Range Filters

```
?dateFrom=2026-01-01&dateTo=2026-05-31
├─ Show: submissions within date range
├─ Use: audit, compliance reporting
└─ Applies: createdAt field
```

#### 6. Combined Filter Scenarios

**Scenario 1: Contractor Dashboard - Items Awaiting Action**
```
?approvalStatus=CHANGES_REQUESTED
  &reviewActionRequired=true
  &page=1
  &limit=20
  &sortBy=updatedAt
  &sortOrder=desc
```

**Scenario 2: Operational Assignment Dialog - Available Drivers**
```
?approvalStatus=APPROVED
  &entityStatus=ACTIVE
  &search=ravi
  &page=1
  &limit=10
```

**Scenario 3: Admin Review - Pending Approvals with Remarks**
```
?approvalStatus=PENDING_APPROVAL
  &hasAdminRemarks=false
  &page=1
  &limit=50
  &sortBy=createdAt
  &sortOrder=asc
```

**Scenario 4: Audit Report - Recent Changes**
```
?dateFrom=2026-04-01
  &dateTo=2026-05-31
  &sortBy=updatedAt
  &sortOrder=desc
  &page=1
  &limit=100
```

**Scenario 5: Contractor Review History**
```
?approvalStatus=REJECTED
  &submittedBy=contractor-user-123
  &page=1
  &limit=20
```

---

## Contractor Workflows

### Workflow 1: Create and Submit New Record

```
1. Contractor fills form (Driver/Vehicle/Site)
   └─ validation: required fields, format checks

2. Contractor submits
   └─ API: POST /api/v1/contractor/drivers
   └─ Response: { record, approvalRequest: { status: PENDING_APPROVAL, ... } }

3. Toast: "Driver submitted for approval"
   └─ Message: explains item awaiting admin review

4. Item appears in UI
   └─ Location: PENDING_APPROVAL tab/filter
   └─ Status badge: "Awaiting Admin Review"
   └─ Cannot use operationally yet
```

### Workflow 2: View Pending Approval Status

```
1. Contractor navigates to "Pending Approvals" tab
   └─ Filter: ?approvalStatus=PENDING_APPROVAL

2. List shows:
   └─ Record name/details
   └─ Submission date (createdAt)
   └─ Status: "Awaiting Admin Review"
   └─ Last updated: when submitted
   └─ Can view details but no operational use

3. Admin reviews (background process)
   └─ No real-time notification in current design
```

### Workflow 3: Receive Admin Feedback - Changes Requested

```
1. Admin sends feedback (CHANGES_REQUESTED)
   └─ Admin remarks: "Please update mobile number format"
   └─ Admin suggestions visible to contractor

2. Contractor sees notification/badge
   └─ Filter: ?approvalStatus=CHANGES_REQUESTED
   └─ Status badge: "Changes Requested"
   └─ Action required indicator (red badge)

3. Contractor opens record
   └─ Views: record details + admin feedback panel
   └─ Feedback shows: date, admin name, specific requests

4. Contractor modifies record
   └─ Updates fields per admin feedback
   └─ Form validation still applies

5. Contractor resubmits
   └─ New submission tracked separately
   └─ Status: PENDING_APPROVAL (fresh review cycle)
   └─ Toast: "Changes submitted for review"
   └─ Submission count incremented
   └─ History preserved: shows original + modifications
```

### Workflow 4: Receive Rejection

```
1. Admin rejects (REJECTED)
   └─ Rejection reason required (e.g., "License expired")
   └─ Admin remarks visible

2. Contractor sees rejection
   └─ Filter: ?approvalStatus=REJECTED
   └─ Status badge: "Rejected" (red)
   └─ Rejection reason displayed prominently
   └─ Cannot modify this record

3. Contractor reviews rejection reason
   └─ Decision point: address or create new record

4. Option A: Create New Record
   └─ Contractor creates fresh record with corrections
   └─ New record is separate submission
   └─ Old rejected record archived/viewable for reference

5. Option B: View History
   └─ Contractor clicks "View History"
   └─ Shows rejection details
   └─ Can reference previous data in new submission
```

### Workflow 5: Use Approved Record Operationally

```
1. Admin approves
   └─ Record status: APPROVED
   └─ Entity status: ACTIVE (default)

2. Contractor sees in operational lists
   └─ Drivers list shows record
   └─ Available in assignment dialogs
   └─ Available in dropdowns/selects

3. Contractor assigns to operation
   └─ API: POST /api/v1/contractor/assignments
   └─ Record is now operationally used
```

### Workflow 6: Update Approved Record

```
1. Contractor modifies APPROVED record
   └─ Some fields editable (mobile, address)
   └─ Some fields immutable (license number)

2. API: PUT /api/v1/contractor/drivers/:id
   └─ Changes trigger new approval cycle
   └─ Response: { record, approvalRequest: { status: PENDING_APPROVAL } }

3. Record status reverts to PENDING_APPROVAL
   └─ Changes queued for admin review
   └─ Still operationally usable (if previous approval holds)
   └─ Or: blocks operational use until re-approved (stricter)

4. Toast: "Update submitted for approval"
```

### Workflow 7: Deactivate/Reactivate Record

```
1. Contractor toggles ACTIVE/INACTIVE
   └─ Approval status unchanged
   └─ Entity status changes: ACTIVE → INACTIVE

2. If INACTIVE:
   └─ Record not shown in assignment dialogs
   └─ Not available for new assignments
   └─ Cannot be used operationally

3. If ACTIVE again:
   └─ Record reappears in operational lists
   └─ Can be assigned again
   └─ No admin approval needed for toggle
```

---

## Admin Workflows

### Workflow 1: Review Pending Submissions

```
1. Admin accesses approval queue
   └─ Filter: ?approvalStatus=PENDING_APPROVAL
   └─ Sort: ?sortBy=createdAt&sortOrder=asc (oldest first)

2. Admin reviews record details
   └─ Views: all submission fields
   └─ Views: uploaded documents
   └─ Views: contractor info
   └─ Can compare with previous versions if update

3. Admin makes decision:
   Option A: APPROVE
   ├─ Record becomes operational
   ├─ Contractor sees in lists
   └─ Available for assignments

   Option B: REJECT
   ├─ Provide rejection reason (required)
   ├─ Add remarks/feedback (optional)
   ├─ Record hidden from operations
   └─ Contractor must create new submission

   Option C: CHANGES_REQUESTED
   ├─ Provide specific change requests
   ├─ Add suggestions/examples
   ├─ Record hidden from operations
   └─ Contractor modifies and resubmits
```

### Workflow 2: Request Changes with Feedback

```
1. Admin identifies issues
   └─ Missing document format
   └─ Data correction needed
   └─ Compliance concern (not final rejection)

2. Admin sends CHANGES_REQUESTED
   └─ API: PUT /api/v1/contractor/drivers/:id/approval
   └─ Payload: { approvalStatus: CHANGES_REQUESTED, remarks: "..." }

3. Admin remarks visible to contractor
   └─ Examples: "Please provide updated address proof"
   └─ Suggestions: "License should be valid for 3+ years"

4. Contractor receives notification
   └─ Email/dashboard: "Changes requested for Driver X"
   └─ Action required badge on record

5. Contractor modifies and resubmits
   └─ Goes back through approval cycle
   └─ Admin can request additional changes

6. History tracked
   └─ Shows all feedback rounds
   └─ Audit trail: dates, feedback, modifications
```

### Workflow 3: Reject with Reason

```
1. Admin determines record cannot be approved
   └─ Compliance violation
   └─ Data non-recoverable
   └─ Cannot be fixed with suggestions

2. Admin rejects with mandatory reason
   └─ API: PUT /api/v1/contractor/drivers/:id/approval
   └─ Payload: { approvalStatus: REJECTED, reason: "..." }

3. Rejection is final
   └─ Cannot be appealed/overturned
   └─ Contractor must create new record

4. Contractor notified
   └─ Sees rejection reason
   └─ Can reference old record for context
```

### Workflow 4: Suspend for Compliance

```
1. Admin identifies operational issue
   └─ Safety concern with vehicle
   └─ Driver license expiration approaching
   └─ Payment non-compliance

2. Admin suspends
   └─ API: PUT /api/v1/contractor/drivers/:id/entity-status
   └─ Payload: { entityStatus: SUSPENDED, reason: "..." }
   └─ Approval status unchanged (still APPROVED)

3. Record taken out of operations
   └─ Removed from assignment dialogs
   └─ Cannot be used for new assignments
   └─ Existing assignments affected (separate logic)

4. Contractor notified
   └─ Sees suspension reason
   └─ Cannot reactivate (requires admin)
```

### Workflow 5: Audit and Reporting

```
1. Admin runs approval report
   └─ Date range: ?dateFrom=2026-01-01&dateTo=2026-05-31
   └─ Status: ?approvalStatus=APPROVED (or any status)
   └─ Can see approval metrics

2. Report includes:
   └─ Total submissions
   └─ Approval rate
   └─ Average review time
   └─ Rejection reasons
   └─ Resubmission trends

3. Admin views submission history
   └─ Filter by submittedBy user
   └─ Track contractor performance
```

---

## Visibility & Operational Rules

### Rule Set 1: Contractor Listing Visibility

| Approval Status | Entity Status | Contractor Can View | Contractor Can Use | Notes |
|---|---|---|---|---|
| PENDING_APPROVAL | ACTIVE | ✅ Yes | ❌ No | Awaiting admin review |
| PENDING_APPROVAL | INACTIVE | ✅ Yes | ❌ No | Contractor disabled |
| APPROVED | ACTIVE | ✅ Yes | ✅ **Yes** | Operationally available |
| APPROVED | INACTIVE | ✅ Yes | ❌ No | Contractor disabled it |
| APPROVED | SUSPENDED | ✅ Yes | ❌ No | Admin suspended it |
| REJECTED | ACTIVE | ✅ Yes | ❌ No | View reason only |
| CHANGES_REQUESTED | ACTIVE | ✅ Yes | ❌ No | Requires modification |

### Rule Set 2: Assignment Dialog Availability

**Only show records where:**
- `approvalStatus === APPROVED` AND
- `entityStatus === ACTIVE`

**Hide records if:**
- `approvalStatus === PENDING_APPROVAL` (awaiting approval)
- `approvalStatus === REJECTED` (non-compliant)
- `approvalStatus === CHANGES_REQUESTED` (incomplete)
- `entityStatus !== ACTIVE` (not operational)

### Rule Set 3: Search & Filter Defaults

**Contractor Default View**: 
```
GET /api/v1/contractor/drivers
└─ Shows: APPROVED + ACTIVE records
└─ Reason: operational view
└─ Pagination: applied
```

**Contractor "All Status" View**:
```
GET /api/v1/contractor/drivers?includeAllStates=true
└─ Shows: all approval/entity statuses
└─ Reason: contractor needs full visibility
└─ Includes: PENDING, REJECTED, CHANGES_REQUESTED
```

**Contractor "Pending" View**:
```
GET /api/v1/contractor/drivers?approvalStatus=PENDING_APPROVAL
└─ Shows: only PENDING records
└─ Reason: track submissions awaiting review
```

### Rule Set 4: Record Detail Visibility

**Contractor viewing APPROVED record:**
- Can see all details
- Can see past approval history (read-only)
- Can see admin remarks (if any from approval)
- Can edit certain fields
- Cannot see confidential admin notes

**Contractor viewing REJECTED record:**
- Can see all details
- **Must** see rejection reason prominently
- Can see admin remarks/feedback
- Cannot edit directly
- Can reference for new submission

**Contractor viewing CHANGES_REQUESTED record:**
- Can see all details
- **Must** see change requests prominently
- Can see admin feedback/suggestions
- Can edit per admin feedback
- Can resubmit

---

## API Design Expectations

### Required Endpoints

#### 1. List Drivers with Filtering
```
GET /api/v1/contractor/drivers
Query Parameters:
  - approvalStatus: PENDING_APPROVAL|APPROVED|REJECTED|CHANGES_REQUESTED
  - entityStatus: ACTIVE|INACTIVE|SUSPENDED|MAINTENANCE
  - reviewActionRequired: true|false
  - hasAdminRemarks: true|false
  - resubmissionRequired: true|false
  - submittedBy: user-id (optional)
  - dateFrom: YYYY-MM-DD
  - dateTo: YYYY-MM-DD
  - search: string (name, mobile, license, etc.)
  - sortBy: createdAt|updatedAt|approvedAt
  - sortOrder: asc|desc
  - page: number
  - limit: number

Response:
{
  success: boolean,
  data: {
    data: [
      {
        id: string,
        name: string,
        licenseNumber: string,
        mobileNumber: string,
        status: "ACTIVE"|"INACTIVE"|"SUSPENDED"|"MAINTENANCE",
        approvalStatus: "PENDING_APPROVAL"|"APPROVED"|"REJECTED"|"CHANGES_REQUESTED",
        createdAt: ISO8601,
        updatedAt: ISO8601,
        approvalRequest: {
          status: string,
          remarks?: string,
          reason?: string,
          requestedChanges?: string[],
          reviewHistory?: [{
            status: string,
            date: ISO8601,
            adminName: string,
            remarks?: string
          }]
        }
      }
    ],
    meta: {
      total: number,
      page: number,
      limit: number,
      totalPages: number,
      hasNextPage: boolean
    }
  }
}
```

#### 2. Get Driver Detail
```
GET /api/v1/contractor/drivers/:id

Response:
{
  success: boolean,
  data: {
    id: string,
    name: string,
    licenseNumber: string,
    mobileNumber: string,
    status: "ACTIVE"|"INACTIVE",
    approvalStatus: "PENDING_APPROVAL"|"APPROVED"|"REJECTED"|"CHANGES_REQUESTED",
    createdAt: ISO8601,
    updatedAt: ISO8601,
    approvalRequest: {
      status: string,
      remarks?: string,
      reason?: string (for REJECTED),
      requestedChanges?: {
        field: string,
        feedback: string,
        suggestion?: string
      }[],
      submissionHistory?: [
        {
          submissionNumber: number,
          submittedAt: ISO8601,
          approvalStatus: string,
          adminFeedback?: string
        }
      ]
    }
  }
}
```

#### 3. Create Driver
```
POST /api/v1/contractor/drivers

Request:
{
  name: string,
  licenseNumber: string,
  mobileNumber: string,
  status: "ACTIVE"|"INACTIVE"
}

Response:
{
  success: boolean,
  data: {
    record: { ...driver details },
    approvalRequest: {
      status: "PENDING_APPROVAL",
      submittedAt: ISO8601,
      message: "Waiting for admin review"
    }
  }
}
```

#### 4. Update Driver
```
PUT /api/v1/contractor/drivers/:id

Request:
{
  name?: string,
  licenseNumber?: string,
  mobileNumber?: string,
  status?: "ACTIVE"|"INACTIVE"
}

Response: Same as Create
```

#### 5. Admin Approve/Reject/Request Changes
```
PUT /api/v1/admin/drivers/:id/approval

Request (APPROVE):
{
  approvalStatus: "APPROVED"
}

Request (REJECT):
{
  approvalStatus: "REJECTED",
  reason: "License expired" (required),
  remarks?: "Additional notes..."
}

Request (CHANGES_REQUESTED):
{
  approvalStatus: "CHANGES_REQUESTED",
  remarks?: "Please update mobile format",
  requestedChanges?: [
    {
      field: "mobileNumber",
      feedback: "Invalid format",
      suggestion: "+91-XXXXX-XXXXX"
    }
  ]
}

Response:
{
  success: boolean,
  data: {
    id: string,
    approvalStatus: string,
    approvalRequest: {...}
  }
}
```

#### 6. Update Entity Status
```
PUT /api/v1/contractor/drivers/:id/status

Request:
{
  entityStatus: "ACTIVE"|"INACTIVE"|"SUSPENDED"|"MAINTENANCE",
  reason?: string (for suspension)
}

Response:
{
  success: boolean,
  data: { ...driver with updated status }
}
```

### Same Pattern for Vehicles & Sites

All endpoints follow same structure:
- `/api/v1/contractor/vehicles`
- `/api/v1/contractor/sites`
- `/api/v1/admin/vehicles/:id/approval`
- `/api/v1/admin/sites/:id/approval`

---

## Implementation Checklist

### Data Model Updates
- [ ] Add `approvalStatus` field to Driver, Vehicle, Site models
- [ ] Add `entityStatus` field (rename/clarify existing `status`)
- [ ] Create `ApprovalRequest` embedded document:
  - [ ] `status` (PENDING_APPROVAL, APPROVED, REJECTED, CHANGES_REQUESTED)
  - [ ] `reason` (for rejections)
  - [ ] `remarks` (admin feedback)
  - [ ] `requestedChanges` (array of change requests)
  - [ ] `submissionHistory` (track all versions)
  - [ ] `reviewHistory` (admin review timeline)
- [ ] Add indexes for filtering:
  - [ ] `approvalStatus`
  - [ ] `entityStatus`
  - [ ] `createdAt`, `updatedAt`
  - [ ] Composite indexes for common filter combinations

### API Implementation (Backend)

#### Endpoints to Build
- [ ] `GET /api/v1/contractor/drivers` with all query parameters
- [ ] `GET /api/v1/contractor/drivers/:id` with approval details
- [ ] `POST /api/v1/contractor/drivers` (creates PENDING_APPROVAL)
- [ ] `PUT /api/v1/contractor/drivers/:id` (updates, triggers PENDING_APPROVAL for changes)
- [ ] `PUT /api/v1/contractor/drivers/:id/status` (toggle ACTIVE/INACTIVE)
- [ ] `PUT /api/v1/admin/drivers/:id/approval` (approve/reject/request changes)
- [ ] Same 6 endpoints for Vehicles
- [ ] Same 6 endpoints for Sites

#### Query Logic to Implement
- [ ] Approval status filtering with multiple values
- [ ] Entity status filtering
- [ ] `reviewActionRequired` computed field:
  - [ ] True if `approvalStatus in (REJECTED, CHANGES_REQUESTED)`
- [ ] `hasAdminRemarks` computed field:
  - [ ] True if `approvalRequest.remarks` exists
- [ ] `resubmissionRequired` computed field:
  - [ ] True if `approvalStatus in (REJECTED, CHANGES_REQUESTED)`
- [ ] Date range filtering on `createdAt`
- [ ] Full-text search on name, mobile, license, etc.
- [ ] Sorting by createdAt, updatedAt, approvedAt
- [ ] Pagination with limit/offset

#### Business Logic to Implement
- [ ] New submission defaults to `approvalStatus: PENDING_APPROVAL`
- [ ] Default `entityStatus: ACTIVE`
- [ ] Approval updates do NOT change entity status
- [ ] Update to existing record creates new approval request
- [ ] Cannot update approval-sensitive fields after creation
- [ ] Rejection is final—no un-rejection
- [ ] Changes can be requested multiple times
- [ ] Track submission count and history

### Frontend Implementation

#### Components to Build/Update
- [ ] List view filters (approval status dropdown, entity status dropdown)
- [ ] Filter bar with all parameters
- [ ] Status badges for approval + entity status
- [ ] "Action Required" indicator for CHANGES_REQUESTED, REJECTED
- [ ] Admin remarks panel (read-only for contractor)
- [ ] Change request details display
- [ ] Rejection reason display (prominent)
- [ ] Submission history timeline
- [ ] Resubmit button for REJECTED, CHANGES_REQUESTED

#### Filtering UI States
- [ ] Default view: APPROVED + ACTIVE only
- [ ] "Pending Approvals" tab: approvalStatus=PENDING_APPROVAL
- [ ] "Action Required" tab: approvalStatus in (REJECTED, CHANGES_REQUESTED)
- [ ] "All Status" tab: no approval filter (show all)
- [ ] Search across all fields
- [ ] Date range picker for audit queries

#### Workflows to Implement
- [ ] Create → auto-redirect to PENDING tab (show submission status)
- [ ] Update APPROVED record → show "Changes submitted for review"
- [ ] View REJECTED record → show rejection reason prominently
- [ ] View CHANGES_REQUESTED → show requested changes + field suggestions
- [ ] Resubmit after changes → clear previous feedback, start new cycle

### Testing Checklist
- [ ] PENDING_APPROVAL record NOT available in assignment dialogs
- [ ] APPROVED + ACTIVE record available in assignment dialogs
- [ ] REJECTED record shows rejection reason
- [ ] CHANGES_REQUESTED record shows admin feedback
- [ ] Filter combinations work (e.g., approvalStatus + entityStatus)
- [ ] Search works across multiple fields
- [ ] Pagination works with filters
- [ ] Sorting works (createdAt, updatedAt, approvedAt)
- [ ] Admin can approve/reject/request changes
- [ ] Contractor resubmit after changes goes to PENDING_APPROVAL
- [ ] Entity status toggle doesn't affect approval status
- [ ] SUSPENDED status cannot be toggled by contractor

### Documentation to Create
- [ ] API specification document (OpenAPI/Swagger)
- [ ] Contractor workflow guide
- [ ] Admin review workflow guide
- [ ] Filtering guide with examples
- [ ] State transition diagrams
- [ ] Database schema documentation

---

## Contractor UI Structure (Recommended)

### Navigation/Tabs
```
Drivers
├─ Pending Approvals (count badge)
├─ Approved (default)
├─ Changes Required (action badge - red)
├─ Rejected (count badge)
└─ All Records (with filtering)

Same structure for Vehicles and Sites
```

### List Item Display

**APPROVED + ACTIVE**:
```
┌─ Driver Name ─────────────────────────────────────────┐
│ License: AP092024009999 | Mobile: 9876543210         │
│ Status: ✅ ACTIVE | Approved: May 1, 2026            │
│ [View] [Edit] [Menu]                                  │
└────────────────────────────────────────────────────────┘
```

**PENDING_APPROVAL**:
```
┌─ Driver Name ─────────────────────────────────────────┐
│ License: AP092024009999 | Mobile: 9876543210         │
│ Status: ⏳ PENDING APPROVAL | Submitted: May 5, 2026  │
│ [View] [Resubmit] [Menu]                              │
└────────────────────────────────────────────────────────┘
```

**CHANGES_REQUESTED** (with action badge):
```
┌─ ⚠️ Driver Name ─────────────────────────────────────┐
│ License: AP092024009999 | Mobile: 9876543210         │
│ Status: 🔴 CHANGES REQUIRED | Updated: May 3, 2026   │
│ Admin: "Please update mobile format"                  │
│ [View Details] [Make Changes] [Menu]                  │
└────────────────────────────────────────────────────────┘
```

**REJECTED**:
```
┌─ Driver Name ─────────────────────────────────────────┐
│ License: AP092024009999 | Mobile: 9876543210         │
│ Status: ❌ REJECTED | Date: May 2, 2026               │
│ Reason: "License validity < 1 year"                  │
│ [View Details] [Create New] [Menu]                    │
└────────────────────────────────────────────────────────┘
```

### Detail View - Admin Feedback Panel

For CHANGES_REQUESTED:
```
┌─ Admin Feedback ──────────────────────────────┐
│ Status: Changes Requested on May 3, 2026     │
│ Admin: John Smith (Approver)                  │
│                                               │
│ Remarks:                                      │
│ "Please correct the following issues:"       │
│                                               │
│ • Mobile Number: Invalid format              │
│   Suggestion: Use +91-XXXXX-XXXXX format    │
│                                               │
│ • Address: Missing pincode                   │
│   Suggestion: Required for compliance       │
│                                               │
│ [Submit Changes] [View History]              │
└───────────────────────────────────────────────┘
```

For REJECTED:
```
┌─ Rejection Details ───────────────────────────┐
│ Status: REJECTED on May 2, 2026              │
│ Admin: Jane Doe (Compliance)                  │
│                                               │
│ Reason:                                       │
│ "License validity is less than 1 year.      │
│  Cannot approve. Please resubmit with       │
│  renewed license."                           │
│                                               │
│ Additional Notes:                             │
│ "Also ensure address proof is current."      │
│                                               │
│ [Create New Record] [View History]           │
└───────────────────────────────────────────────┘
```

---

## Summary

This design provides:

✅ **Clear State Management**: Two independent dimensions (approval + entity status)
✅ **Comprehensive Filtering**: 13 query parameters covering all use cases
✅ **Professional Workflows**: Separate paths for approval, rejection, changes
✅ **Audit Trail**: Full history of submissions and approvals
✅ **Operational Safety**: Only APPROVED + ACTIVE records available for operations
✅ **Contractor Transparency**: Clear feedback and action items
✅ **Admin Control**: Multiple decision paths with detailed feedback
✅ **Enterprise Grade**: Pagination, search, sorting, date ranges, full audit
