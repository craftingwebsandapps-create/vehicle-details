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
  Settings,
  Users,
  Car,
  MapPin,
  Building2,
  Tags,
  UserCog,
  ScrollText,
  QrCode,
  LogOut,
  ChevronUp,
  User2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
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
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg group-data-[collapsible=icon]:size-8">
                  <img
                    src={`${import.meta.env.BASE_URL}logo.png`}
                    alt=""
                    width={40}
                    height={40}
                    className="size-7 object-contain group-data-[collapsible=icon]:size-6"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User2 className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Administrator</span>
                    <span className="text-xs text-muted-foreground">admin@example.com</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-(--radix-dropdown-menu-trigger-width)"
              >
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 size-4 text-destructive" />
                  <span className="text-destructive">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
