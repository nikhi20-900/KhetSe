import { NextResponse } from "next/server";

import type { ProblemDetails } from "@/lib/contracts/problem";
import {
  getRegisteredHarvest,
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return respond(getRegisteredHarvest(id));
}
