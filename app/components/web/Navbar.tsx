import { Link, NavLink } from "react-router"

import { cn } from "~/lib/utils"

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/web/about", label: "About" },
  { to: "/web/contact", label: "Contact" },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-sm font-semibold tracking-[0.16em] text-foreground uppercase"
        >
          Vehicle Information
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "bg-primary/10 font-medium text-primary"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
