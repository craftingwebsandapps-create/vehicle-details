import { useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router"

import { useAppDispatch, useAppSelector } from "~/hooks"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { loginMobileThunk } from "~/features/auth/authSlice"
import { isAdminAuthenticated } from "~/utils/auth"

export default function AdminLogin() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const authState = useAppSelector((state) => state.auth)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  if (isAdminAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await dispatch(loginMobileThunk({ email, password })).unwrap()
      navigate("/admin/dashboard", { replace: true })
    } catch {
      return
    }
  }

  return (
    <section className="rounded-[28px] border border-border/70 bg-background p-5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.5)] sm:p-6">
      <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
        Admin Portal
      </p>
      <h1 className="mt-2 font-heading text-2xl font-semibold text-foreground">
        Sign in to continue
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Access protected admin routes after successful authentication.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {authState.status === "failed" ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {authState.error || "Unable to login"}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={authState.status === "loading"}
        >
          {authState.status === "loading" ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </section>
  )
}
