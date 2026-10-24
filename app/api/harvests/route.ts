import { NextResponse } from "next/server";

/**
 * Harvest Intake API Route (Placeholder)
 *
 * Planned Scope: Validate intake payload, persist harvest records, and initialize planning flow.
 * Tracked in: GitHub Issue #2 (Implement harvest intake and feasibility explanations)
 * Suggested Owner: Person 2 — Backend and database
 */

export async function GET() {
  return NextResponse.json(
    {
      statusCode: 501,
      error: "Not Implemented",
      message:
        "Harvest list endpoint is a placeholder. Implementation is tracked in GitHub Issue #2.",
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
        "Harvest intake submission endpoint is a placeholder. Implementation is tracked in GitHub Issue #2.",
      scaffold: true,
    },
    { status: 501 }
  );
}
