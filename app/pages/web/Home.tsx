import { PublicVehicleLookup } from "~/components/web/PublicVehicleLookup"

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-0 pb-16 pt-6 sm:pt-10 md:max-w-5xl md:pt-14">
      <header className="mb-8 flex flex-col items-center gap-5 sm:mb-10 sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        <div className="flex shrink-0 justify-center sm:justify-start">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            width={160}
            height={160}
            className="h-14 w-auto max-w-[10rem] object-contain object-left sm:h-16 sm:max-w-[11rem]"
            decoding="async"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
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
        </div>
      </header>
      <PublicVehicleLookup />
    </div>
  )
}
