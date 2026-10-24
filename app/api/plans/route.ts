import { NextResponse } from "next/server";

import type { ProblemDetails } from "@/lib/contracts/problem";
import {
  generatePlans,
  readJsonBody,
  type ServiceResult,
} from "@/lib/planning/harvest-service";

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
  const harvestId = new URL(request.url).searchParams.get("harvestId") ?? "";
  return respond(generatePlans({ harvestId }));
}

export async function POST(request: Request) {
  const body = await readJsonBody(request, "/api/plans");
  if (body.kind === "invalid") {
    return respond(body.result);
  }
  return respond(generatePlans(body.value));
}
