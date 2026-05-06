import { Bell, Shield, UserRound } from "lucide-react"

import { useAppDispatch, useAppSelector } from "~/app/hooks"
import { Button } from "~/components/ui/button"
import { signInDemo, signOut } from "~/features/auth/authSlice"

const preferences = [
  { label: "Push notifications", icon: Bell },
  { label: "Identity verification", icon: Shield },
  { label: "Profile settings", icon: UserRound },
]

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/60 bg-background p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-3xl bg-primary text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/20">
            {user?.initials ?? "GU"}
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              {user?.name ?? "Guest User"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAuthenticated ? user?.email : "You are browsing with demo guest access."}
            </p>
          </div>
        </div>
        <Button
          className="mt-5 w-full"
          onClick={() => dispatch(isAuthenticated ? signOut() : signInDemo())}
        >
          {isAuthenticated ? "Sign out" : "Sign in"}
        </Button>
      </section>

      <section className="space-y-3">
        {preferences.map((item) => {
          const Icon = item.icon

          return (
            <article key={item.label} className="flex items-center gap-4 rounded-[24px] border border-border/60 bg-background p-4 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">
                  Manage preferences for this production-ready starter flow.
                </p>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}