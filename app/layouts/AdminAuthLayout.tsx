import { Outlet } from "react-router"

export default function AdminAuthLayout() {
  return (
    <div className="min-h-dvh bg-muted/20 p-2">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-120 items-center justify-center">
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
