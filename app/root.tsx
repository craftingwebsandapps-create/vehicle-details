import { Outlet, ScrollRestoration } from "react-router"
import { Toaster } from "./components/ui/sonner"

export default function Root() {
  return (
    <>
      <Toaster richColors />
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
