import { useEffect } from "react"
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
  active: number
  inactive: number
  icon: React.ElementType
  accentClass: string
}

function StatCard({
  label,
  total,
  active,
  inactive,
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
          <span className="text-muted-foreground">{active} active</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-rose-400" />
          <span className="text-muted-foreground">{inactive} inactive</span>
        </span>
      </div>
    </article>
  )
}

// ─── Utilization Bar ─────────────────────────────────────────────────────────

type UtilizationBarProps = {
  label: string
  percent: number
  colorClass: string
}

function UtilizationBar({ label, percent, colorClass }: UtilizationBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
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
  const { data, status } = useAppSelector((s) => s.dashboard)

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
          Failed to load dashboard data. Tap refresh to try again.
        </div>
      ) : data ? (
        <>
          {/* ── Hero banner ── */}
          <section className="rounded-[28px] bg-primary p-5 text-primary-foreground shadow-[0_18px_48px_-28px_rgba(234,88,12,0.5)]">
            <p className="text-sm opacity-80">This week</p>
            <p className="mt-1 text-4xl font-semibold">
              {data.recentAssignmentsThisWeek}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {data.recentAssignmentsThisWeek === 1
                ? "assignment"
                : "assignments"}
            </p>
            <div className="mt-4 flex gap-4 border-t border-white/20 pt-4 text-sm">
              <span className="opacity-80">
                <span className="font-semibold text-white">
                  {data.unassignedDrivers}
                </span>{" "}
                unassigned {data.unassignedDrivers === 1 ? "driver" : "drivers"}
              </span>
              <span className="opacity-20">·</span>
              <span className="opacity-80">
                <span className="font-semibold text-white">
                  {data.unassignedVehicles}
                </span>{" "}
                unassigned{" "}
                {data.unassignedVehicles === 1 ? "vehicle" : "vehicles"}
              </span>
            </div>
          </section>

          {/* ── Stat cards grid ── */}
          <section className="grid grid-cols-2 gap-3">
            <StatCard
              label="Drivers"
              total={data.drivers.total}
              active={data.drivers.active}
              inactive={data.drivers.inactive}
              icon={Users}
              accentClass="bg-blue-100 text-blue-600"
            />
            <StatCard
              label="Vehicles"
              total={data.vehicles.total}
              active={data.vehicles.active}
              inactive={data.vehicles.inactive}
              icon={Car}
              accentClass="bg-amber-100 text-amber-600"
            />
            <StatCard
              label="Sites"
              total={data.sites.total}
              active={data.sites.active}
              inactive={data.sites.inactive}
              icon={MapPin}
              accentClass="bg-emerald-100 text-emerald-600"
            />
            <StatCard
              label="Assignments"
              total={data.assignments.total}
              active={data.assignments.active}
              inactive={data.assignments.inactive}
              icon={ClipboardList}
              accentClass="bg-violet-100 text-violet-600"
            />
          </section>

          {/* ── Utilization ── */}
          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="mb-4 text-sm font-medium text-foreground">
              Vehicles utilization
            </p>
            <div className="space-y-4">
              <UtilizationBar
                label="Driver utilization"
                percent={data.utilization.driverUtilizationPercent}
                colorClass="bg-blue-500"
              />
              <UtilizationBar
                label="Vehicle utilization"
                percent={data.utilization.vehicleUtilizationPercent}
                colorClass="bg-amber-500"
              />
            </div>
          </section>

          {/* ── Work types & contractors ── */}
          <section className="grid grid-cols-2 gap-3">
            <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-pink-100 p-1.5 text-pink-600">
                  <Briefcase className="size-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Work types
                </span>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {data.workTypes.total}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.workTypes.active} active
              </p>
            </article>

            <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-teal-100 p-1.5 text-teal-600">
                  <Users className="size-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Contractors
                </span>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {data.contractors.total}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.contractors.active} active
              </p>
            </article>
          </section>
        </>
      ) : null}
    </div>
  )
}
