"use client";

import Image from "next/image";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Contractor = {
  _id: string;
  name: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  status: string;
};

type Site = {
  _id: string;
  name: string;
  location: string;
  status: string;
};

type Vehicle = {
  _id: string;
  name: string;
  contractor: Contractor;
  type: string;
  registrationNumber: string;
  document: string;
  status: string;
  site: Site;
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

type Driver = {
  _id: string;
  name: string;
  mobileNumber: string;
  licenceNumber: string;
  licenceUrl?: string;
} | null;

type ApiResponse = {
  success: boolean;
  message: string;
  data: {
    vehicle: Vehicle;
    contractor: Contractor;
    site: Site;
    driver: Driver;
  };
} | null;

const REGISTRATION_NUMBER_PATTERN = /^[A-Za-z0-9-]{4,20}$/;

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isLikelyUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status?.toUpperCase() === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
        isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-600" : "bg-red-600"}`}
      />
      {status}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
        {label}
      </p>
      <div className="mt-1 text-base font-semibold text-slate-900">
        {children}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border overflow-hidden border-slate-300 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5 sm:px-5 sm:py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fde6d3] text-[#a31e22]">
          {icon}
        </span>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function VehicleSearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const registrationNumber = useMemo(
    () => (searchParams.get("registrationNumber")?.trim() ?? "").toUpperCase(),
    [searchParams],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResponse>(null);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("registrationNumber") ?? "")
      .trim()
      .toUpperCase();

    if (!value) {
      setError("Please enter a registration number.");
      return;
    }
    if (!REGISTRATION_NUMBER_PATTERN.test(value)) {
      setError("Invalid registration number format.");
      return;
    }

    setError("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("registrationNumber", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function fetchVehicleDetails() {
      if (!registrationNumber) {
        setError("");
        setResult(null);
        setLoading(false);
        return;
      }
      if (!REGISTRATION_NUMBER_PATTERN.test(registrationNumber)) {
        setError("Invalid registration number format.");
        setResult(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setResult(null);

      try {
        const response = await fetch(
          `/api/vehicle/search?registrationNumber=${encodeURIComponent(registrationNumber)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = (await response.json()) as ApiResponse;
        if (!response.ok || !data?.success)
          throw new Error(data?.message || "Unable to fetch vehicle details.");
        if (!controller.signal.aborted) setResult(data);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to fetch vehicle details.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchVehicleDetails();
    return () => controller.abort();
  }, [registrationNumber]);

  const vehicle = result?.data?.vehicle;
  const contractor = result?.data?.contractor;
  const site = result?.data?.site;
  const driver = result?.data?.driver;

  return (
    <div className="min-h-screen bg-[#fde6d3]/30">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-[#a31e22]">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:gap-4">
          <Image
            src="/APCRDA-LOGO.png"
            alt="APCRDA Logo"
            width={3508}
            height={2244}
            className="object-contain"
            style={{ height: "4.5rem", width: "auto" }}
            priority
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#a31e22]">
              Government of Andhra Pradesh
            </p>
            <h1 className="text-lg font-extrabold leading-tight text-[#7a1315] sm:text-xl">
              APCRDA — Vehicle Information Portal
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {/* Search card */}
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Search Vehicle</h2>
          <p className="mt-1 text-base text-slate-700">
            Enter a vehicle registration number to fetch details.
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                key={registrationNumber}
                type="text"
                name="registrationNumber"
                defaultValue={registrationNumber}
                placeholder="e.g. AP09DR9900"
                className="h-12 w-full rounded-lg border-2 border-slate-400 bg-white pl-10 pr-3 text-base font-semibold uppercase tracking-wider text-slate-900 placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-[#a31e22] focus:outline-none focus:ring-2 focus:ring-[#a31e22]/20"
                autoComplete="off"
                aria-label="Vehicle registration number"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 min-w-28 items-center justify-center gap-2 rounded-lg bg-[#a31e22] px-6 text-base font-bold text-white transition hover:bg-[#7a1315] focus:outline-none focus:ring-2 focus:ring-[#a31e22]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Searching…
                </>
              ) : (
                "Search"
              )}
            </button>
          </form>

          {error && (
            <div className="mt-3 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3.5 text-base font-semibold text-red-800">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!registrationNumber && !loading && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <svg
              className="h-12 w-12 text-[#fbb980]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>
            <p className="mt-4 text-base font-semibold text-slate-700">
              Enter a registration number to get started
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
            <svg
              className="h-10 w-10 animate-spin text-[#a31e22]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p className="mt-4 text-base font-semibold text-slate-700">
              Fetching vehicle details…
            </p>
          </div>
        )}

        {/* Results */}
        {vehicle && (
          <div className="mt-6 space-y-4">
            {/* Vehicle hero */}
            <SectionCard
              title="Vehicle Information"
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
              }
            >
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <Field label="Registration No.">
                    <span className="font-mono text-xl font-extrabold tracking-wider text-[#7a1315]">
                      {vehicle.registrationNumber}
                    </span>
                  </Field>
                  <Field label="Status">
                    <StatusBadge status={vehicle.status} />
                  </Field>
                  <Field label="Vehicle Name">{vehicle.name || "-"}</Field>
                  <Field label="Vehicle Type">{vehicle.type || "-"}</Field>
                  <Field label="Registered On">
                    {formatDate(vehicle.createdAt)}
                  </Field>
                  <Field label="Last Updated">
                    {formatDate(vehicle.updatedAt)}
                  </Field>
                </div>
                {vehicle.document && (
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                      Document
                    </p>
                    {isLikelyUrl(vehicle.document) ? (
                      <>
                        <a
                          href={vehicle.document}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Image
                            src={vehicle.document}
                            alt="Vehicle document"
                            width={200}
                            height={130}
                            loading="eager"
                            className="h-32 w-full max-w-48 rounded-lg border border-slate-200 object-cover shadow-sm transition hover:opacity-90"
                          />
                        </a>
                        <a
                          href={vehicle.document}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-blue-700 underline hover:text-blue-900"
                        >
                          View full image ↗
                        </a>
                      </>
                    ) : (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                        {vehicle.document}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Contractor + Site side by side on wider screens */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {contractor && (
                <SectionCard
                  title="Contractor"
                  icon={
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                      />
                    </svg>
                  }
                >
                  <div className="space-y-3.5">
                    <Field label="Company Name">{contractor.name}</Field>
                    <Field label="Contact Person">
                      {contractor.contactPerson}
                    </Field>
                    <Field label="Mobile">{contractor.mobileNumber}</Field>
                    <Field label="Email">{contractor.email}</Field>
                    <Field label="Status">
                      <StatusBadge status={contractor.status} />
                    </Field>
                  </div>
                </SectionCard>
              )}

              {site && (
                <SectionCard
                  title="Site"
                  icon={
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  }
                >
                  <div className="space-y-3.5">
                    <Field label="Site Name">{site.name}</Field>
                    <Field label="Location">{site.location}</Field>
                    <Field label="Status">
                      <StatusBadge status={site.status} />
                    </Field>
                  </div>
                </SectionCard>
              )}
            </div>

            {/* Driver */}
            <SectionCard
              title="Driver"
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              }
            >
              {driver ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Driver Name">{driver.name || "-"}</Field>
                  <Field label="Mobile Number">
                    {driver.mobileNumber || "-"}
                  </Field>
                  <Field label="Licence Number">
                    {driver.licenceNumber || "-"}
                  </Field>
                  {driver.licenceUrl && isLikelyUrl(driver.licenceUrl) && (
                    <div className="sm:col-span-2">
                      <Field label="Licence Document">
                        <div className="mt-1 flex flex-col items-start gap-2">
                          <a
                            href={driver.licenceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Image
                              src={driver.licenceUrl}
                              alt="Driver licence"
                              width={220}
                              height={140}
                              loading="eager"
                              className="h-32 w-full max-w-56 rounded-lg border border-slate-200 object-cover shadow-sm transition hover:opacity-90"
                            />
                          </a>
                          <a
                            href={driver.licenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-blue-700 underline hover:text-blue-900"
                          >
                            View licence image ↗
                          </a>
                        </div>
                      </Field>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-base font-semibold text-slate-700">
                  <svg
                    className="h-5 w-5 shrink-0 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  No driver assigned to this vehicle.
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </main>

      <footer className="mt-8 border-t-4 border-[#7a1315] bg-[#a31e22] py-5 text-center text-sm font-semibold text-white">
        © {new Date().getFullYear()} APCRDA — Amaravati Capital Region
        Development Authority
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fde6d3]/30">
          <svg
            className="h-10 w-10 animate-spin text-[#a31e22]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
      }
    >
      <VehicleSearchContent />
    </Suspense>
  );
}
