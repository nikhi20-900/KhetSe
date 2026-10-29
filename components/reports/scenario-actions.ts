import type { ScenarioCommandResult } from "@/lib/contracts/scenario.contract";
import { formatModeledInr } from "@/lib/planning/format";

export function scenarioRequestBody(action: "reset" | "replay") {
  return action === "replay"
    ? { action, scenarioId: "alternative-recovery" }
    : { action: "reset" as const };
}

export function scenarioActionDetail(result: ScenarioCommandResult): string {
  if (result.action === "reset") {
    return "Scenario reset completed. Capacity was restored and demonstration shipment records were cleared. This did not create a shipment, and it did not change the farmer-desk preview.";
  }
  const net = result.modeledOutcome?.netProceedsInr;
  const amount =
    typeof net === "number" ? formatModeledInr(net) : "unavailable";
  return `Scenario replay completed for ${result.scenarioId ?? "an unknown scenario"}. Modeled net proceeds ${amount}. This is not a persisted shipment outcome.`;
}

function isScenarioResult(value: unknown): value is ScenarioCommandResult {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.restored !== true || record.status !== "SIMULATED") return false;
  if (record.action === "reset") {
    return record.scenarioId === null && record.modeledOutcome === null;
  }
  if (record.action !== "replay" || typeof record.scenarioId !== "string") {
    return false;
  }
  const outcome = record.modeledOutcome;
  if (!outcome || typeof outcome !== "object") return false;
  return (
    typeof (outcome as { netProceedsInr?: unknown }).netProceedsInr === "number"
  );
}

export async function requestScenarioAction(
  action: "reset" | "replay"
): Promise<ScenarioCommandResult> {
  const response = await fetch("/api/scenarios", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(scenarioRequestBody(action)),
  });
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      detail = `HTTP ${response.status}`;
    }
    throw new Error(detail);
  }
  const body: unknown = await response.json();
  if (!isScenarioResult(body)) {
    throw new Error("The scenario response did not match the contract.");
  }
  return body;
}
