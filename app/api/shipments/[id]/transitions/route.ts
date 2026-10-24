import { NextResponse } from "next/server";

import { shipmentTransitionSchema } from "@/lib/contracts/shipment.contract";
import {
  validationProblem,
  type ProblemDetails,
} from "@/lib/contracts/problem";
import { databaseConfigured } from "@/lib/db/client";
import { ShipmentError, transitionShipment } from "@/lib/db/queries/shipments";
import type { NormalShipmentStatus } from "@/lib/domain/state-machine";

export const runtime = "nodejs";

function problem(
  status: number,
  title: string,
  detail: string,
  instance: string,
  code?: string
) {
  const body: ProblemDetails & { error?: string } = {
    type: "https://khetse.org/errors/invalid-shipment-transition",
    title,
    status,
    detail,
    instance,
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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const instance = `/api/shipments/${id}/transitions`;
  if (!databaseConfigured()) {
    return problem(
      503,
      "Database unavailable",
      "DATABASE_URL is not set.",
      instance
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(
      400,
      "Malformed JSON",
      "The request body is not valid JSON.",
      instance
    );
  }
  const parsed = shipmentTransitionSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(
      JSON.stringify(validationProblem(parsed.error, instance)),
      {
        status: 422,
        headers: { "content-type": "application/problem+json" },
      }
    );
  }
  try {
    const result = await transitionShipment(id, {
      status: parsed.data.status as NormalShipmentStatus,
      occurredAt: new Date(parsed.data.occurredAt),
      location: parsed.data.location,
    });
    return NextResponse.json(result, {
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
        instance,
        error.code
      );
    }
    return problem(
      500,
      "Shipment failed",
      "The shipment transition could not be recorded.",
      instance
    );
  }
}
