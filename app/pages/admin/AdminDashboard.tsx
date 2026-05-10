import { useCallback, useEffect, useState } from "react"

import {
  Building2,
  Car,
  Link2,
  MapPin,
  RefreshCw,
  Tags,
  UserCog,
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"
import { getAdminDashboard } from "~/features/admin/api"
import { useAppSelector } from "~/hooks"
import { getApiErrorMeta } from "~/services/api-error"
import type {
  AdminDashboardApprovalSplit,
  AdminDashboardData,
} from "~/types/admin-dashboard"

function fmt(n: number) {
  return n.toLocaleString()
}

function ApprovalBreakdown({ row }: { row: AdminDashboardApprovalSplit }) {
  return (
    <p className="text-muted-foreground text-xs">
      Pending {fmt(row.pending)} · Approved {fmt(row.approved)} · Rejected{" "}
      {fmt(row.rejected)}
      <span className="text-muted-foreground/80">
        {" "}
        (total includes other statuses)
      </span>
    </p>
  )
}

export default function AdminDashboard() {
  const contractorId = useAppSelector((s) => s.auth.contractorId)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const superadminOnly = isAuthenticated && contractorId === null

  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setErrorCode(undefined)
    try {
      const next = await getAdminDashboard()
      setData(next)
    } catch (e: unknown) {
      const meta = getApiErrorMeta(e)
      setError(meta.message)
      setErrorCode(meta.code)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (superadminOnly) {
      void load()
    }
  }, [superadminOnly, load])

  if (!superadminOnly) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <Alert variant="destructive">
          <AlertTitle>Superadmin only</AlertTitle>
          <AlertDescription>
            Platform overview uses{" "}
            <code className="text-xs">GET /api/admin/dashboard</code>. Tenant
            sessions receive{" "}
            <code className="text-xs">FORBIDDEN_SUPERADMIN_ONLY</code>. Sign in
            with a platform account that has no{" "}
            <code className="text-xs">contractorId</code> in the JWT.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw
            className={`size-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load dashboard</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>
              {error}
              {errorCode ? (
                <>
                  {" "}
                  <code className="text-xs">({errorCode})</code>
                </>
              ) : null}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {error && !data ? null : (
        <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contractors</CardTitle>
            <Building2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {fmt(data?.contractors ?? 0)}
              </div>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              Active contractors only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <UserCog className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {fmt(data?.users.total ?? 0)}
              </div>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              Tenant {fmt(data?.users.tenantUsers ?? 0)} · Superadmin{" "}
              {fmt(data?.users.superadminUsers ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Work types</CardTitle>
            <Tags className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {fmt(data?.workTypes ?? 0)}
              </div>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              Active catalog entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active driver assignments
            </CardTitle>
            <Link2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {fmt(data?.activeDriverAssignments ?? 0)}
              </div>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              Rows with <code className="text-xs">unassignedAt: null</code>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
            <Car className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && !data ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {fmt(data?.vehicles.total ?? 0)}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  total
                </span>
              </div>
            )}
            {data ? <ApprovalBreakdown row={data.vehicles} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sites</CardTitle>
            <MapPin className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && !data ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {fmt(data?.sites.total ?? 0)}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  total
                </span>
              </div>
            )}
            {data ? <ApprovalBreakdown row={data.sites} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Drivers</CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && !data ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {fmt(data?.drivers.total ?? 0)}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  total
                </span>
              </div>
            )}
            {data ? <ApprovalBreakdown row={data.drivers} /> : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
          <CardDescription>
            Counts reflect backend aggregation rules: soft-deleted rows are
            excluded from contractor, user, work type, vehicle, site, and driver
            totals; approval buckets only include explicit pending, approved,
            and rejected statuses.
          </CardDescription>
        </CardHeader>
      </Card>
        </>
      )}
    </div>
  )
}
