import { CircleUserRound, LogIn, LogOut, Menu, Smartphone } from "lucide-react"
import { Link, NavLink } from "react-router"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { cn } from "~/lib/utils"
import { signInDemo, signOut } from "~/features/auth/authSlice"
import { setMobileMenuOpen } from "~/features/ui/uiSlice"

const navLinks = [
  { to: "/home", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
]

export default function Navbar() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const mobileMenuOpen = useAppSelector((state) => state.ui.mobileMenuOpen)

  const handleAuthToggle = () => {
    if (isAuthenticated) {
      dispatch(signOut())
      return
    }

    dispatch(signInDemo())
  }

  const closeMobileMenu = () => dispatch(setMobileMenuOpen(false))

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/home"
          className="flex items-center gap-3 text-sm font-semibold tracking-[0.18em] text-foreground uppercase"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            VI
          </span>
          <span className="hidden sm:inline">Vehicle Information</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
                  isActive && "bg-primary/10 text-primary"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" asChild>
            <Link to="/app/dashboard" className="gap-2">
              <Smartphone className="size-4" />
              Open app
            </Link>
          </Button>
          <div className="flex items-center gap-3 rounded-full border border-border/70 bg-background px-3 py-1.5 shadow-sm">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
              {user?.initials ?? "GU"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.name ?? "Guest User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {isAuthenticated
                  ? user?.email
                  : "Sign in to manage your account"}
              </p>
            </div>
          </div>
          <Button onClick={handleAuthToggle}>
            {isAuthenticated ? (
              <>
                <LogOut className="size-4" />
                Sign out
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                Sign in
              </>
            )}
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={() => dispatch(setMobileMenuOpen(true))}
        >
          <Menu className="size-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </div>

      <Dialog
        open={mobileMenuOpen}
        onOpenChange={(open) => dispatch(setMobileMenuOpen(open))}
      >
        <DialogContent
          className="max-w-sm rounded-[28px] border border-border/70 p-6"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Navigation</DialogTitle>
            <DialogDescription>
              Switch between the web experience and the mobile app shell.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/app/dashboard"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 rounded-2xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Smartphone className="size-4" />
              Open mobile app view
            </Link>
          </div>

          <div className="rounded-3xl bg-muted/60 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-background text-foreground shadow-sm">
                <CircleUserRound className="size-5" />
              </span>
              <div>
                <p className="font-medium text-foreground">
                  {user?.name ?? "Guest User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAuthenticated
                    ? user?.email
                    : "Use the demo auth state to preview flows."}
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={handleAuthToggle}>
              {isAuthenticated ? "Sign out" : "Sign in"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
