import { NextResponse } from "next/server";

/**
 * Capacity Reservations API Route (Placeholder)
 *
 * Planned Scope: Transactional capacity reservation for transport slots and warehouse spaces at PostgreSQL boundary.
 * Tracked in: GitHub Issue #3 (Add transactional capacity reservations)
 * Suggested Owner: Person 2 — Backend and database
 */

export async function GET() {
  return NextResponse.json(
    {
      statusCode: 501,
      error: "Not Implemented",
      message:
        "Reservation query endpoint is a placeholder. Implementation is tracked in GitHub Issue #3.",
      scaffold: true,
    },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      statusCode: 501,
      error: "Not Implemented",
      message:
        "Atomic capacity reservation endpoint is a placeholder. Implementation is tracked in GitHub Issue #3.",
      scaffold: true,
    },
    { status: 501 }
  );
}
