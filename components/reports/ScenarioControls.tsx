"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export type ScenarioAction = "reset" | "replay";
export type ScenarioActionState =
  | { status: "idle" }
  | { status: "loading"; action: ScenarioAction }
  | { status: "success"; action: ScenarioAction; message: string }
  | { status: "error"; action: ScenarioAction; message: string };

/** Runs an injected backend operation and reports success only after it resolves. */
export async function runScenarioAction(
  action: ScenarioAction,
  operation: () => Promise<string>,
  setState: (state: ScenarioActionState) => void
) {
  setState({ status: "loading", action });
  try {
    const message = await operation();
    setState({ status: "success", action, message });
  } catch (error) {
    setState({
      status: "error",
      action,
      message: error instanceof Error ? error.message : "The operation failed.",
    });
  }
}

export function ScenarioControls({
  onReset,
  onReplay,
}: {
  onReset?: () => Promise<string>;
  onReplay?: () => Promise<string>;
}) {
  const [state, setState] = useState<ScenarioActionState>({ status: "idle" });
  const enabled = Boolean(onReset && onReplay);
  const busy = state.status === "loading";

  async function run(
    action: ScenarioAction,
    operation?: () => Promise<string>
  ) {
    if (
      !operation ||
      !window.confirm(`Confirm ${action} of the demo scenario?`)
    )
      return;
    await runScenarioAction(action, operation, setState);
  }

  return (
    <Card
      className="print:hidden"
      header={
        <div>
          <h2 className="font-semibold text-charcoal-950">Demo scenarios</h2>
          <p className="mt-1 text-sm text-charcoal-600">
            Reset restores database capacity and clears demonstration shipment
            records. Replay returns the registered alternative-recovery net.
            Neither action writes the farmer-desk preview, and replay does not
            create a shipment. Confirm before either action.
          </p>
        </div>
      }
    >
      {!enabled ? (
        <div className="mb-4 rounded-md border border-sand-300 bg-sand-50 p-3 text-sm leading-5 text-charcoal-700">
          Scenario reset and replay are unavailable. No scenario API or
          supported scenario identifiers are currently defined.
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={!enabled || busy}
          onClick={() => void run("reset", onReset)}
        >
          Reset scenario
        </Button>
        <Button
          variant="secondary"
          disabled={!enabled || busy}
          onClick={() => void run("replay", onReplay)}
        >
          Replay scenario
        </Button>
      </div>
      {state.status === "loading" ? (
        <p role="status" className="mt-3 text-sm text-charcoal-600">
          {state.action === "reset"
            ? "Resetting scenario…"
            : "Replaying scenario…"}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p role="status" className="mt-3 text-sm font-medium text-sage-800">
          {state.message}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p
          role="alert"
          className="mt-3 text-sm font-medium text-terracotta-800"
        >
          {state.action === "reset"
            ? "Scenario reset failed"
            : "Scenario replay failed"}
          : {state.message}
        </p>
      ) : null}
    </Card>
  );
}
