import { Outlet } from "react-router"

export default function MobileAuthLayout() {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,rgba(255,247,237,1),rgba(255,255,255,1))] px-4 py-4">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-120 items-center justify-center">
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
