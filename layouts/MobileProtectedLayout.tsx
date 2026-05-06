import { Outlet } from "react-router"

import MobileLayout from "~/layouts/MobileLayout"

export default function MobileProtectedLayout() {
  return (
    <MobileLayout>
      <Outlet />
    </MobileLayout>
  )
}
