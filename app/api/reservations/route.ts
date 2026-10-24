import { NextResponse } from "next/server";

import { reservationRequestSchema } from "@/lib/contracts/reservation.contract";
import {
  validationProblem,
  type ProblemDetails,
} from "@/lib/contracts/problem";
import { databaseConfigured } from "@/lib/db/client";
import { ReservationError, bookCapacity } from "@/lib/db/queries/reservations";

export const runtime = "nodejs";

function problem(status: number, title: string, detail: string, code?: string) {
  const body: ProblemDetails & { error?: string } = {
    type:
      status === 409
        ? "https://khetse.org/errors/capacity-conflict"
        : "https://khetse.org/errors/reservation",
    title,
    status,
    detail,
    instance: "/api/reservations",
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
      "DATABASE_URL is not set, so capacity cannot be locked at the PostgreSQL boundary."
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
  const parsed = reservationRequestSchema.safeParse(body);
  if (!parsed.success) {
    const details = validationProblem(parsed.error, "/api/reservations");
    return new NextResponse(JSON.stringify(details), {
      status: 422,
      headers: { "content-type": "application/problem+json" },
    });
  }
  try {
    const result = await bookCapacity({
      ...parsed.data,
      idempotencyKey: request.headers.get("Idempotency-Key") ?? undefined,
    });
    return NextResponse.json(result, {
      status: 201,
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
        error.code
      );
    }
    return problem(
      500,
      "Reservation failed",
      "The capacity transaction could not be completed."
    );
  }
}
