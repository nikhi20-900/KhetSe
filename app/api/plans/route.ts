import { NextResponse } from "next/server";

/**
 * Logistics Plans API Route (Placeholder)
 *
 * Planned Scope: Compute feasible plan combinations and evaluate constraints with explicit rejection reasons.
 * Tracked in: GitHub Issue #2 (Implement harvest intake and feasibility explanations)
 * Suggested Owner: Person 2 (API) & Person 3 (Feasibility Rules)
 */

export async function GET() {
  return NextResponse.json(
    {
      statusCode: 501,
      error: "Not Implemented",
      message:
        "Logistics plan query endpoint is a placeholder. Implementation is tracked in GitHub Issue #2.",
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
        "Plan generation and ranking endpoint is a placeholder. Implementation is tracked in GitHub Issue #2.",
      scaffold: true,
    },
    { status: 501 }
  );
}
