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
        "Listing reports is not supported. Read one stored shipment with GET /api/reports/{id}.",
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
        "Creating reports by POST is not supported. A stored shipment report is built by GET /api/reports/{id}.",
      scaffold: true,
    },
    { status: 501 }
  );
}
