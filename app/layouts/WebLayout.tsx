import { Outlet } from "react-router"

export default function WebLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-1 justify-center px-4 sm:px-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
