import { Outlet } from "react-router"

import Footer from "~/components/web/Footer"
import Navbar from "~/components/web/Navbar"

export default function WebLayout() {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,1))]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 pt-8 pb-14 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
