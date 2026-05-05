"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const registrationNumber = useMemo(
    () => searchParams.get("registrationNumber")?.trim() ?? "",
    [searchParams],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResponse>(null);

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
                <DetailRow
                  label="Document"
                  value={result.data.vehicle.document}
                />
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
