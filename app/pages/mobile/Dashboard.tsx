import { useEffect } from "react"
import { Link } from "react-router"
import {
  Car,
  ClipboardList,
  MapPin,
  RefreshCw,
  Users,
  Briefcase,
} from "lucide-react"

import { useAppDispatch, useAppSelector } from "~/hooks"
import { fetchDashboardThunk } from "~/features/dashboard/dashboardSlice"
import { Skeleton } from "~/components/ui/skeleton"

// ─── Stat Card ───────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string
  total: number
  approved: number
  pending: number
  rejected: number
  icon: React.ElementType
  accentClass: string
}

function StatCard({
  label,
  total,
  approved,
  pending,
  rejected,
  icon: Icon,
  accentClass,
}: StatCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <div className={`rounded-lg p-1.5 ${accentClass}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-3xl font-semibold text-foreground">{total}</p>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">{approved} approved</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">{pending} pending</span>
        </span>
      </div>
      <div className="text-xs text-muted-foreground">{rejected} rejected</div>
    </article>
  )
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-5 pb-6">
      <Skeleton className="h-28 w-full rounded-[28px]" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const { data, status, errorCode } = useAppSelector((s) => s.dashboard)

  useEffect(() => {
    void dispatch(fetchDashboardThunk())
  }, [dispatch])

  const handleRefresh = () => {
    void dispatch(fetchDashboardThunk())
  }

  return (
    <div className="space-y-5 pb-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">Operations overview</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={status === "loading"}
          className="rounded-xl border border-border/60 bg-card p-2 shadow-sm transition-colors active:bg-muted disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw
            className={`size-4 text-muted-foreground ${status === "loading" ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {status === "loading" && !data ? (
        <DashboardSkeleton />
      ) : status === "failed" ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {errorCode === "FORBIDDEN_TENANT_ONLY"
            ? "Tenant access required. Sign in with a contractor account to view this dashboard."
            : "Failed to load dashboard data. Tap refresh to try again."}
        </div>
      ) : data ? (
        <>
          {/* ── Hero banner ── */}
          <section className="rounded-[28px] bg-primary p-5 text-primary-foreground shadow-[0_18px_48px_-28px_rgba(234,88,12,0.5)]">
            <p className="text-sm opacity-80">Active assignments</p>
            <p className="mt-1 text-4xl font-semibold">
              {data.activeDriverAssignments ?? 0}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {data.activeDriverAssignments === 1 ? "assignment" : "assignments"}
            </p>
            <div className="mt-4 flex gap-4 border-t border-white/20 pt-4 text-sm">
              <span className="opacity-80">
                <span className="font-semibold text-white">
                  {data.vehicles?.pending ?? 0}
                </span>{" "}
                pending vehicles
              </span>
              <span className="opacity-20">·</span>
              <span className="opacity-80">
                <span className="font-semibold text-white">
                  {data.drivers?.pending ?? 0}
                </span>{" "}
                pending drivers
              </span>
            </div>
          </section>

          {/* ── Stat cards grid ── */}
          <section className="grid grid-cols-2 gap-3">
            <StatCard
              label="Drivers"
              total={data.drivers?.total ?? 0}
              approved={data.drivers?.approved ?? 0}
              pending={data.drivers?.pending ?? 0}
              rejected={data.drivers?.rejected ?? 0}
              icon={Users}
              accentClass="bg-blue-100 text-blue-600"
            />
            <StatCard
              label="Vehicles"
              total={data.vehicles?.total ?? 0}
              approved={data.vehicles?.approved ?? 0}
              pending={data.vehicles?.pending ?? 0}
              rejected={data.vehicles?.rejected ?? 0}
              icon={Car}
              accentClass="bg-amber-100 text-amber-600"
            />
            <StatCard
              label="Sites"
              total={data.sites?.total ?? 0}
              approved={data.sites?.approved ?? 0}
              pending={data.sites?.pending ?? 0}
              rejected={data.sites?.rejected ?? 0}
              icon={MapPin}
              accentClass="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              label="Assignments"
              total={data.activeDriverAssignments ?? 0}
              approved={data.activeDriverAssignments ?? 0}
              pending={0}
              rejected={0}
              icon={ClipboardList}
              accentClass="bg-violet-100 text-violet-600"
            />
          </section>

          <Link
            to="/mobile/organization"
            className="block rounded-2xl border border-border/60 bg-card p-4 text-sm text-foreground shadow-sm transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">Organization</p>
                <p className="text-xs text-muted-foreground">
                  View contractor profile details
                </p>
              </div>
              <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                <Briefcase className="size-4" />
              </div>
            </div>
          </Link>
        </>
      ) : null}
    </div>
  )
}
