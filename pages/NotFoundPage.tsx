import { Link } from "react-router"

import { Button } from "~/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-xl rounded-[32px] border border-border/60 bg-background p-8 text-center shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)]">
        <p className="text-sm font-semibold tracking-[0.22em] text-primary uppercase">
          404
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold text-foreground">
          The requested route does not exist.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Head back to the website home or jump directly into the mobile app experience.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/home">Go to web home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/home">Open mobile app</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}