"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  __v: number;
};

type Driver = {
  [key: string]: unknown;
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

type DetailProps = {
  label: string;
  value?: string | number | null;
};

function DetailRow({ label, value }: DetailProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-slate-200 py-2 text-sm last:border-b-0">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="break-all text-slate-900">{value || "-"}</span>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const registrationNumber = useMemo(
    () => searchParams.get("registrationNumber")?.trim() ?? "",
    [searchParams],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResponse>(null);
  const vehicleDocumentUrl = result?.data?.vehicle?.document ?? "";

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("registrationNumber") ?? "").trim();
    if (!value) {
      setError("Please enter a registration number.");
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("registrationNumber", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    let ignore = false;

    async function fetchVehicleDetails() {
      if (!registrationNumber) {
        setError("Missing registrationNumber param in URL.");
        setResult(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setResult(null);

      try {
        const response = await fetch(
          `https://vi-backend.theamaravaticity.com/vehicle/search?registrationNumber=${encodeURIComponent(registrationNumber)}`,
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}.`);
        }

        const data = (await response.json()) as ApiResponse;
        if (!ignore) {
          setResult(data);
        }
      } catch {
        if (!ignore) {
          setError("Unable to fetch vehicle details. Please try again.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchVehicleDetails();

    return () => {
      ignore = true;
    };
  }, [registrationNumber]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Vehicle Details
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Fetching data based on the URL param: registrationNumber.
        </p>

        <form
          onSubmit={handleSearch}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            name="registrationNumber"
            defaultValue={registrationNumber}
            placeholder="Enter registration number"
            className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Search
          </button>
        </form>

        <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
          registrationNumber: {registrationNumber || "(not provided)"}
        </p>

        {loading && (
          <p className="mt-4 text-sm text-slate-600">
            Loading vehicle details...
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {result?.data && (
          <div className="mt-6 space-y-4">
            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-900">
                Vehicle
              </h2>
              <div className="mt-2">
                <DetailRow label="ID" value={result.data.vehicle._id} />
                <DetailRow label="Name" value={result.data.vehicle.name} />
                <DetailRow label="Type" value={result.data.vehicle.type} />
                <DetailRow
                  label="Registration"
                  value={result.data.vehicle.registrationNumber}
                />
                <DetailRow label="Status" value={result.data.vehicle.status} />
                <div className="border-b border-slate-200 py-2 last:border-b-0">
                  <p className="text-sm font-medium text-slate-700">Document</p>
                  {vehicleDocumentUrl ? (
                    <div className="mt-2 space-y-2">
                      <a
                        href={vehicleDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-700 underline"
                      >
                        Open image
                      </a>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vehicleDocumentUrl}
                        alt="Vehicle document"
                        className="h-44 w-full max-w-sm rounded-md border border-slate-200 object-cover"
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-600">
                      No document image.
                    </p>
                  )}
                </div>
                <DetailRow
                  label="Created At"
                  value={result.data.vehicle.createdAt}
                />
                <DetailRow
                  label="Updated At"
                  value={result.data.vehicle.updatedAt}
                />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-900">
                Contractor
              </h2>
              <div className="mt-2">
                <DetailRow label="ID" value={result.data.contractor._id} />
                <DetailRow label="Name" value={result.data.contractor.name} />
                <DetailRow
                  label="Contact Person"
                  value={result.data.contractor.contactPerson}
                />
                <DetailRow
                  label="Mobile Number"
                  value={result.data.contractor.mobileNumber}
                />
                <DetailRow label="Email" value={result.data.contractor.email} />
                <DetailRow
                  label="Status"
                  value={result.data.contractor.status}
                />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-900">Site</h2>
              <div className="mt-2">
                <DetailRow label="ID" value={result.data.site._id} />
                <DetailRow label="Name" value={result.data.site.name} />
                <DetailRow label="Location" value={result.data.site.location} />
                <DetailRow label="Status" value={result.data.site.status} />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-900">Driver</h2>
              {result.data.driver ? (
                <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100">
                  {JSON.stringify(result.data.driver, null, 2)}
                </pre>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  No driver assigned.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
