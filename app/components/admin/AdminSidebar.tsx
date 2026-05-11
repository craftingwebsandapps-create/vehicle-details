import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar"
import {
  Home,
  Users,
  Car,
  MapPin,
  Building2,
  Tags,
  UserCog,
  ScrollText,
  QrCode,
  LogOut,
} from "lucide-react"
import { useLocation, Link, useNavigate } from "react-router"
import { useAppDispatch } from "~/hooks"
import { signOut } from "~/features/auth/authSlice"

const navItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: Home },
  { title: "Contractors", url: "/admin/contractors", icon: Building2 },
  { title: "Work types", url: "/admin/work-types", icon: Tags },
  { title: "Users", url: "/admin/users", icon: UserCog },
  { title: "Audit logs", url: "/admin/audit-logs", icon: ScrollText },
  { title: "Vehicles", url: "/admin/vehicles", icon: Car },
  {
    title: "Vehicle QR theme",
    url: "/admin/vehicle-qr-theme",
    icon: QrCode,
  },
  { title: "Drivers", url: "/admin/drivers", icon: Users },
  { title: "Sites", url: "/admin/sites", icon: MapPin },
]

export function AdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleLogout = () => {
    dispatch(signOut())
    navigate("/admin/login", { replace: true })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Vehicle Info · Admin">
              <Link
                to="/admin/dashboard"
                className="min-w-0"
                aria-label="Vehicle Info — Admin Portal. Go to dashboard."
              >
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg group-data-[collapsible=icon]:size-8">
                  <img
                    src={`${import.meta.env.BASE_URL}logo.png`}
                    alt=""
                    width={48}
                    height={48}
                    className="size-10 object-contain group-data-[collapsible=icon]:size-7"
                    decoding="async"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">Vehicle Info</span>
                  <span className="text-muted-foreground truncate text-xs">
                    Admin Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="Log out"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
