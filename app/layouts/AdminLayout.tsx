import { Outlet, useLocation } from "react-router"
import { AdminSidebar } from "~/components/admin/AdminSidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"

function adminSectionTitle(pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/") {
    return "Dashboard"
  }
  const segment = pathname.match(/^\/admin\/([^/]+)/)?.[1]
  if (!segment || segment === "dashboard") {
    return "Dashboard"
  }
  const raw = segment.replace(/-/g, " ")
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const sectionTitle = adminSectionTitle(pathname)

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/dashboard">
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{sectionTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="min-w-0 flex-1 overflow-auto bg-muted/20 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
