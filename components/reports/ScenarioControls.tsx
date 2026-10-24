"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export type ScenarioAction = "reset" | "replay";
export type ScenarioActionState =
  | { status: "idle" }
  | { status: "loading"; action: ScenarioAction }
  | { status: "success"; action: ScenarioAction }
  | { status: "error"; action: ScenarioAction; message: string };

/** Runs an injected backend operation and reports success only after it resolves. */
export async function runScenarioAction(
  action: ScenarioAction,
  operation: () => Promise<void>,
  setState: (state: ScenarioActionState) => void
) {
  setState({ status: "loading", action });
  try {
    await operation();
    setState({ status: "success", action });
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
  onReset?: () => Promise<void>;
  onReplay?: () => Promise<void>;
}) {
  const [state, setState] = useState<ScenarioActionState>({ status: "idle" });
  const enabled = Boolean(onReset && onReplay);
  const busy = state.status === "loading";

  async function run(action: ScenarioAction, operation?: () => Promise<void>) {
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
          <h2 className="font-semibold text-gray-950 dark:text-gray-100">
            Demo scenarios
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Reset or replay a supported scenario after confirmation.
          </p>
        </div>
      }
    >
      {!enabled ? (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-5 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
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
        <p
          role="status"
          className="mt-3 text-sm text-gray-600 dark:text-gray-300"
        >
          {state.action === "reset"
            ? "Resetting scenario…"
            : "Replaying scenario…"}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p
          role="status"
          className="mt-3 text-sm font-medium text-emerald-800 dark:text-emerald-300"
        >
          {state.action === "reset"
            ? "Scenario reset completed."
            : "Scenario replay completed."}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p
          role="alert"
          className="mt-3 text-sm font-medium text-red-800 dark:text-red-300"
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
