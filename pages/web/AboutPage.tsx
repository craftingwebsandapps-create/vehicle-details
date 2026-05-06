const principles = [
  "Two isolated layouts prevent mobile navigation decisions from leaking into the web shell.",
  "Redux Toolkit centralizes UI and auth state with typed hooks for reliable access.",
  "Reusable components keep page-level code focused on composition rather than implementation details.",
]

export default function AboutPage() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[32px] border border-border/60 bg-foreground px-6 py-8 text-background shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] sm:px-8">
        <p className="text-sm font-semibold tracking-[0.22em] text-primary-foreground/70 uppercase">
          Architecture
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight">
          Clean separation between browsing and app usage.
        </h1>
        <p className="mt-4 text-sm leading-7 text-primary-foreground/80">
          The web layout handles discovery, navigation, and account entry points. The mobile layout behaves like a focused application shell with persistent bottom tabs and content padded for touch interaction.
        </p>
      </section>

      <section className="grid gap-4">
        {principles.map((principle, index) => (
          <article
            key={principle}
            className="rounded-[28px] border border-border/60 bg-background/90 p-6 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.35)]"
          >
            <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
              0{index + 1}
            </p>
            <p className="mt-3 text-base leading-7 text-foreground">{principle}</p>
          </article>
        ))}
      </section>
    </div>
  )
}