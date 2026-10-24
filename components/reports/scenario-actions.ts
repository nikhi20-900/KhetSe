export function scenarioRequestBody(action: "reset" | "replay") {
  return action === "replay"
    ? { action, scenarioId: "alternative-recovery" }
    : { action: "reset" as const };
}

export async function requestScenarioAction(
  action: "reset" | "replay"
): Promise<void> {
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
}
