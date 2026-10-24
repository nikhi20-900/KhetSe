import { NextResponse } from "next/server";

import { scenarioCommandSchema } from "@/lib/contracts/scenario.contract";
import {
  validationProblem,
  type ProblemDetails,
} from "@/lib/contracts/problem";
import { databaseConfigured } from "@/lib/db/client";
import {
  replayDemoScenario,
  resetDemoScenario,
} from "@/lib/db/queries/scenarios";

export const runtime = "nodejs";

function problem(status: number, title: string, detail: string) {
  const body: ProblemDetails = {
    type: "https://khetse.org/errors/scenario",
    title,
    status,
    detail,
    instance: "/api/scenarios",
  };
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/problem+json",
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!databaseConfigured()) {
    return problem(
      503,
      "Database unavailable",
      "DATABASE_URL is not set, so the demo scenario cannot be restored."
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(
      400,
      "Malformed JSON",
      "The request body is not valid JSON."
    );
  }
  const parsed = scenarioCommandSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(
      JSON.stringify(validationProblem(parsed.error, "/api/scenarios")),
      {
        status: 422,
        headers: { "content-type": "application/problem+json" },
      }
    );
  }
  try {
    const result =
      parsed.data.action === "reset"
        ? await resetDemoScenario()
        : await replayDemoScenario(parsed.data.scenarioId ?? "");
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return problem(
      500,
      "Scenario command failed",
      "The demo scenario could not be restored."
    );
  }
}
