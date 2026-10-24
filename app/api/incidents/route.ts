import { NextResponse } from "next/server";

import type { ProblemDetails } from "@/lib/contracts/problem";
import {
  injectDemoBreakdown,
  resetDemoShipment,
  submitRecoveryDecision,
  viewShipment,
  type ServiceResult,
} from "@/lib/operations/recovery-service";
import { DEMO_SHIPMENT_ID } from "@/lib/contracts/incident.contract";

export const runtime = "nodejs";

function respond<T>(result: ServiceResult<T>) {
  if (!result.ok) {
    return new NextResponse(
      JSON.stringify(result.body satisfies ProblemDetails),
      {
        status: result.status,
        headers: {
          "content-type": "application/problem+json",
          "cache-control": "no-store",
        },
      }
    );
  }
  return NextResponse.json(result.body, {
    status: result.status,
    headers: { "cache-control": "no-store" },
  });
}

export async function GET(request: Request) {
  const shipmentId =
    new URL(request.url).searchParams.get("shipmentId") ?? DEMO_SHIPMENT_ID;
  return respond(viewShipment(shipmentId));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({
      ok: false,
      status: 400,
      body: {
        type: "https://khetse.org/errors/malformed-json",
        title: "Malformed JSON",
        status: 400,
        detail: "The request body is not valid JSON.",
        instance: "/api/incidents",
      },
    });
  }

  const action =
    body &&
    typeof body === "object" &&
    "action" in body &&
    typeof body.action === "string"
      ? body.action
      : "";
  if (action === "INJECT_BREAKDOWN") return respond(injectDemoBreakdown(body));
  if (action === "RESET_DEMO") return respond(resetDemoShipment());
  return respond(await submitRecoveryDecision(body));
}
