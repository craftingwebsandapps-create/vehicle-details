import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE_URL = "https://vi-backend.theamaravaticity.com";
const REGISTRATION_NUMBER_PATTERN = /^[A-Za-z0-9-]{4,20}$/;
const REQUEST_TIMEOUT_MS = 10000;

function getBackendBaseUrl(): string {
  return process.env.VEHICLE_API_BASE_URL || DEFAULT_BACKEND_BASE_URL;
}

export async function GET(request: NextRequest) {
  const registrationNumber =
    request.nextUrl.searchParams
      .get("registrationNumber")
      ?.trim()
      .toUpperCase() || "";

  if (!registrationNumber) {
    return NextResponse.json(
      { success: false, message: "registrationNumber is required." },
      { status: 400 },
    );
  }

  if (!REGISTRATION_NUMBER_PATTERN.test(registrationNumber)) {
    return NextResponse.json(
      { success: false, message: "registrationNumber format is invalid." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const backendUrl = `${getBackendBaseUrl()}/vehicle/search?registrationNumber=${encodeURIComponent(registrationNumber)}`;

    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const responseBody = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            responseBody?.message ||
            `Upstream request failed with status ${backendResponse.status}.`,
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, message: "Request timed out. Please try again." },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unable to reach vehicle service." },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
