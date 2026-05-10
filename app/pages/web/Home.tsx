import { PublicVehicleLookup } from "~/components/web/PublicVehicleLookup"

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-0 pb-16 pt-6 sm:pt-10 md:max-w-5xl md:pt-14">
      <header className="mb-8 space-y-2 text-center sm:mb-10 sm:text-left">
        <h1
          id="lookup-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Vehicle verification
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-pretty text-sm leading-relaxed sm:mx-0 sm:text-base">
          Enter a registration number to view approved vehicle details shared by
          the operator. Matching ignores spaces and letter case.
        </p>
      </header>
      <PublicVehicleLookup />
    </div>
  )
}
