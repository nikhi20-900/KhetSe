import { NextResponse } from "next/server";

/**
 * Shipment Lifecycle API Route (Placeholder)
 *
 * Planned Scope: Shipment dispatch, checkpoint event logging, status transitions, and timeline queries.
 * Tracked in: GitHub Issue #4 (Build shipment lifecycle and normal delivery path)
 * Suggested Owner: Person 2 — Backend and database
 */

export async function GET() {
  return NextResponse.json(
    {
      statusCode: 501,
      error: "Not Implemented",
      message:
        "Shipment list and status endpoint is a placeholder. Implementation is tracked in GitHub Issue #4.",
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
        "Shipment dispatch and state transition endpoint is a placeholder. Implementation is tracked in GitHub Issue #4.",
      scaffold: true,
    },
    { status: 501 }
  );
}
