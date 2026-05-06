export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Responsive web layout with public routes.</p>
        <p>Mobile authentication is isolated to app routes.</p>
      </div>
    </footer>
  )
}
