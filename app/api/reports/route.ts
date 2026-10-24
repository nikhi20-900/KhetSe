import { NextResponse } from "next/server";

/**
 * Shipment Reports API Route (Placeholder)
 *
 * Planned Scope: Generate full post-shipment audit report, counterfactual financial model summary, and CSV export.
 * Tracked in: GitHub Issue #8 (Create shipment report, export, and resettable scenarios)
 * Suggested Owner: Person 2 (Report Generation API) & Person 3 (Financial Calculation QA)
 */

export async function GET() {
  return NextResponse.json(
    {
      statusCode: 501,
      error: "Not Implemented",
      message:
        "Report summary and export endpoint is a placeholder. Implementation is tracked in GitHub Issue #8.",
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
        "Report compilation trigger endpoint is a placeholder. Implementation is tracked in GitHub Issue #8.",
      scaffold: true,
    },
    { status: 501 }
  );
}
