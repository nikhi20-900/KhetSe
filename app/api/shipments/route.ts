import { NextResponse } from "next/server";

import { createShipmentSchema } from "@/lib/contracts/shipment.contract";
import {
  validationProblem,
  type ProblemDetails,
} from "@/lib/contracts/problem";
import { databaseConfigured } from "@/lib/db/client";
import { ShipmentError, createShipment } from "@/lib/db/queries/shipments";

export const runtime = "nodejs";

function problem(status: number, title: string, detail: string, code?: string) {
  const body: ProblemDetails & { error?: string } = {
    type:
      status === 422
        ? "https://khetse.org/errors/invalid-shipment-transition"
        : "https://khetse.org/errors/shipment",
    title,
    status,
    detail,
    instance: "/api/shipments",
    error: code,
  };
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/problem+json",
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!databaseConfigured()) {
    return problem(
      503,
      "Database unavailable",
      "DATABASE_URL is not set, so a shipment cannot be recorded."
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(
      400,
      "Malformed JSON",
      "The request body is not valid JSON."
    );
  }
  const parsed = createShipmentSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(
      JSON.stringify(validationProblem(parsed.error, "/api/shipments")),
      {
        status: 422,
        headers: { "content-type": "application/problem+json" },
      }
    );
  }
  try {
    const result = await createShipment({
      reservationId: parsed.data.reservationId,
      dispatchedAt: parsed.data.dispatchedAt
        ? new Date(parsed.data.dispatchedAt)
        : undefined,
    });
    return NextResponse.json(result, {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ShipmentError) {
      return problem(
        error.status,
        error.status === 422
          ? "Invalid shipment transition"
          : "Shipment rejected",
        error.message,
        error.code
      );
    }
    return problem(
      500,
      "Shipment failed",
      "The shipment could not be recorded."
    );
  }
}
