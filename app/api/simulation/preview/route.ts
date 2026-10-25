import { NextResponse } from "next/server";

import type { ProblemDetails } from "@/lib/contracts/problem";
import { buildControlRoom } from "@/lib/domain/simulation-control-room";
import { SimulationLabError } from "@/lib/domain/simulation-lab";

export const runtime = "nodejs";

function problem(status: number, detail: string) {
  const body: ProblemDetails = {
    type: "https://khetse.org/errors/simulation-preview",
    title: "Simulation preview rejected",
    status,
    detail,
    instance: "/api/simulation/preview",
  };
  return NextResponse.json(body, {
    status,
    headers: { "content-type": "application/problem+json" },
  });
}

function numberParam(value: string | null) {
  if (value === null || value.trim() === "") return undefined;
  return Number(value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const preview = buildControlRoom({
      cropType: url.searchParams.get("cropType") ?? undefined,
      quantityKg: numberParam(url.searchParams.get("quantityKg")),
      originId: url.searchParams.get("originId") ?? undefined,
      destinationId: url.searchParams.get("destinationId") ?? undefined,
      vehicleId: url.searchParams.get("vehicleId") ?? undefined,
      delayHours: numberParam(url.searchParams.get("delayHours")),
      temperatureExcursionHours: numberParam(
        url.searchParams.get("temperatureExcursionHours")
      ),
    });
    return NextResponse.json(preview, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof SimulationLabError) {
      return problem(422, error.message);
    }
    return problem(500, "The simulation preview could not be calculated.");
  }
}
