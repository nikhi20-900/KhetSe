import { NextResponse } from "next/server";

import type { ProblemDetails } from "@/lib/contracts/problem";
import { databaseConfigured } from "@/lib/db/client";
import {
  ReservationError,
  cancelReservation,
  getReservation,
} from "@/lib/db/queries/reservations";

export const runtime = "nodejs";

function problem(
  status: number,
  title: string,
  detail: string,
  instance: string
) {
  const body: ProblemDetails = {
    type: "https://khetse.org/errors/reservation",
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
  if (!databaseConfigured()) {
    return problem(
      503,
      "Database unavailable",
      "DATABASE_URL is not set.",
      `/api/reservations/${id}`
    );
  }
  try {
    const result = await getReservation(id);
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ReservationError) {
      return problem(
        error.status,
        "Reservation rejected",
        error.message,
        `/api/reservations/${id}`
      );
    }
    return problem(
      500,
      "Reservation failed",
      "The reservation could not be read.",
      `/api/reservations/${id}`
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!databaseConfigured()) {
    return problem(
      503,
      "Database unavailable",
      "DATABASE_URL is not set.",
      `/api/reservations/${id}`
    );
  }
  try {
    const result = await cancelReservation(id);
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ReservationError) {
      return problem(
        error.status,
        "Reservation rejected",
        error.message,
        `/api/reservations/${id}`
      );
    }
    return problem(
      500,
      "Reservation failed",
      "The reservation could not be cancelled.",
      `/api/reservations/${id}`
    );
  }
}
