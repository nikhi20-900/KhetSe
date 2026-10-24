import { NextResponse } from "next/server";

import type { ProblemDetails } from "@/lib/contracts/problem";
import { databaseConfigured } from "@/lib/db/client";
import { ShipmentError, getShipment } from "@/lib/db/queries/shipments";

export const runtime = "nodejs";

function problem(
  status: number,
  title: string,
  detail: string,
  instance: string
) {
  const body: ProblemDetails = {
    type: "https://khetse.org/errors/shipment",
    title,
    status,
    detail,
    instance,
  };
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/problem+json",
      "cache-control": "no-store",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const instance = `/api/shipments/${id}`;
  if (!databaseConfigured()) {
    return problem(
      503,
      "Database unavailable",
      "DATABASE_URL is not set.",
      instance
    );
  }
  try {
    const result = await getShipment(id);
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ShipmentError) {
      return problem(
        error.status,
        "Shipment rejected",
        error.message,
        instance
      );
    }
    return problem(
      500,
      "Shipment failed",
      "The shipment could not be read.",
      instance
    );
  }
}
