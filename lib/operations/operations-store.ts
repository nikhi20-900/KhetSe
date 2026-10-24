import fs from "fs";
import path from "path";

import {
  applyRecoveryDecision,
  createDemoOperations,
  injectBreakdown,
  type OperationsState,
  type RecoveryDecision,
} from "@/lib/domain/recovery";

function storeFile(): string {
  const directory =
    process.env.KHETSE_DATA_DIR ?? path.join(process.cwd(), "data");
  return path.join(directory, "operations.json");
}

export function readOperations(): OperationsState {
  const file = storeFile();
  if (!fs.existsSync(file)) return createDemoOperations();
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed || typeof parsed !== "object" || !("shipment" in parsed)) {
      return createDemoOperations();
    }
    return parsed as OperationsState;
  } catch {
    return createDemoOperations();
  }
}

export function writeOperations(state: OperationsState): void {
  const file = storeFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

export function saveIfChanged(
  previous: OperationsState,
  next: OperationsState
): OperationsState {
  if (next !== previous) writeOperations(next);
  return next;
}

export function resetOperations(): OperationsState {
  const file = storeFile();
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return createDemoOperations();
}

export function withInjectedBreakdown(state: OperationsState): OperationsState {
  return injectBreakdown(state);
}

export function withDecision(
  state: OperationsState,
  decision: RecoveryDecision
) {
  return applyRecoveryDecision(state, decision);
}
