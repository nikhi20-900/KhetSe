import { NextResponse } from "next/server";

/**
 * Incidents & Recovery API Route (Placeholder)
 *
 * Planned Scope: In-transit incident injection, alternative recovery computation, and human-approved atomic swaps.
 * Tracked in: GitHub Issue #6 (Add disruption alerts and human-approved recovery)
 * Suggested Owner: Person 2 (API & Atomic Swaps) & Person 3 (Disruption Engine)
 */

export async function GET() {
  return NextResponse.json(
    {
      statusCode: 501,
      error: "Not Implemented",
      message:
        "Incident query and recovery options endpoint is a placeholder. Implementation is tracked in GitHub Issue #6.",
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
        "Incident recording and recovery approval endpoint is a placeholder. Implementation is tracked in GitHub Issue #6.",
      scaffold: true,
    },
    { status: 501 }
  );
}
