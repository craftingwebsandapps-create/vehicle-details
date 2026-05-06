import { Outlet } from "react-router"

import Navbar from "~/components/Navbar"

export default function WebLayout() {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,251,1))]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 bg-background/85">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Vehicle Information platform for web and app-first journeys.</p>
          <p>Built with React Router Data Mode, Redux Toolkit, TypeScript, and shadcn/ui.</p>
        </div>
      </footer>
    </div>
  )
}