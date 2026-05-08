import { useEffect, useRef } from "react"

import { ArrowRightLeft, ClipboardList, Map, UserSquare2 } from "lucide-react"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import {
  fetchAssignmentsThunk,
  fetchMoreAssignmentsThunk,
} from "~/features/assignments/assignmentsSlice"

export default function Assignments() {
  const dispatch = useAppDispatch()
  const {
    items: assignments,
    hasNextPage,
    loadMoreStatus,
    status,
    error,
  } = useAppSelector((state) => state.assignments)

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    void dispatch(fetchAssignmentsThunk())
  }, [dispatch])

  useEffect(() => {
    const node = loadMoreRef.current

    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasNextPage &&
          loadMoreStatus !== "loading"
        ) {
          void dispatch(fetchMoreAssignmentsThunk())
        }
      },
      { rootMargin: "180px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [dispatch, hasNextPage, loadMoreStatus])

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/60 bg-background p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Assignments
            </p>
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Link drivers, vehicles, and routes.
            </h2>
          </div>
        </div>
      </section>

      {status === "loading" ? (
        <section className="space-y-3">
          <article className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Loading assignments...
            </p>
          </article>
        </section>
      ) : null}

      {status === "failed" ? (
        <section className="space-y-3">
          <article className="rounded-[26px] border border-destructive/30 bg-destructive/10 p-5 shadow-sm">
            <p className="text-sm text-destructive">
              {error ?? "Unable to load assignments"}
            </p>
          </article>
        </section>
      ) : null}

      {status !== "loading" && status !== "failed" ? (
        <section className="space-y-3">
          {assignments.map((assignment, index) => (
            <article
              key={
                assignment.id ||
                `${assignment.vehicleLabel}-${assignment.driverName}-${index}`
              }
              className="rounded-[26px] border border-border/60 bg-background p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">
                  {assignment.vehicleLabel}
                </p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {assignment.status}
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <UserSquare2 className="size-4 text-primary" />
                  {assignment.driverName}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Map className="size-4 text-primary" />
                  {assignment.route}
                </p>
                <p className="inline-flex items-center gap-2">
                  <ArrowRightLeft className="size-4 text-primary" />
                  Route assignment synced.
                </p>
              </div>
            </article>
          ))}

          <div ref={loadMoreRef} className="py-2 text-center">
            {hasNextPage ? (
              <p className="text-xs text-muted-foreground">
                Loading more assignments...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                End of assignment list
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
