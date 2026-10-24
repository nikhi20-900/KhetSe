import { NextResponse } from "next/server";

import type { ProblemDetails } from "@/lib/contracts/problem";
import { databaseConfigured } from "@/lib/db/client";
import { ShipmentError, getShipment } from "@/lib/db/queries/shipments";
import { shipmentReportEnvelope } from "@/lib/domain/shipment-report";

export const runtime = "nodejs";

function problem(
  status: number,
  title: string,
  detail: string,
  instance: string
) {
  const body: ProblemDetails = {
    type: "https://khetse.org/errors/report",
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
  const instance = `/api/reports/${id}`;
  if (!databaseConfigured()) {
    return problem(
      503,
      "Database unavailable",
      "DATABASE_URL is not set.",
      instance
    );
  }
  try {
    const shipment = await getShipment(id);
    const report = await shipmentReportEnvelope({
      shipmentId: shipment.shipmentId,
      status: shipment.status,
    });
    return NextResponse.json(report, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ShipmentError) {
      return problem(
        error.status,
        "Report unavailable",
        error.message,
        instance
      );
    }
    return problem(
      500,
      "Report failed",
      "The shipment report could not be built.",
      instance
    );
  }
}
