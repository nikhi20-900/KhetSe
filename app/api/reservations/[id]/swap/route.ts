import { NextResponse } from "next/server";

import { reservationSwapSchema } from "@/lib/contracts/reservation.contract";
import {
  validationProblem,
  type ProblemDetails,
} from "@/lib/contracts/problem";
import { databaseConfigured } from "@/lib/db/client";
import {
  ReservationError,
  swapReservation,
} from "@/lib/db/queries/reservations";

export const runtime = "nodejs";

function problem(
  status: number,
  title: string,
  detail: string,
  instance: string,
  code?: string
) {
  const body: ProblemDetails & { error?: string } = {
    type:
      status === 409
        ? "https://khetse.org/errors/capacity-conflict"
        : "https://khetse.org/errors/reservation",
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
  const instance = `/api/reservations/${id}/swap`;
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
  const parsed = reservationSwapSchema.safeParse(body);
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
    const result = await swapReservation({
      reservationId: id,
      transportSlotId: parsed.data.transportSlotId,
      storageFacilityId: parsed.data.storageFacilityId,
      idempotencyKey: request.headers.get("Idempotency-Key") ?? undefined,
    });
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ReservationError) {
      return problem(
        error.status,
        error.status === 409
          ? "Capacity Allocation Conflict"
          : "Reservation rejected",
        error.message,
        instance,
        error.code
      );
    }
    return problem(
      500,
      "Reservation failed",
      "The recovery swap could not be completed.",
      instance
    );
  }
}
