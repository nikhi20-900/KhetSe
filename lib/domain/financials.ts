/**
 * Itemizes a modeled branch that the reference calculator already priced.
 * This module does not apply a second gross, spoilage, or logistics formula.
 */
import type { CounterfactualBranch } from "@/lib/domain/counterfactual";

export const FINANCIALS_DOMAIN_STATUS =
  "ITEMIZED_FROM_REFERENCE_MODEL" as const;

export interface ItemizedModeledCost {
  component: string;
  amountInr: number;
  meaning: "modeled estimate";
}

const COST_LABELS: Record<
  keyof CounterfactualBranch["costBreakdownInr"],
  string
> = {
  dispatch: "Dispatch",
  transport: "Transport",
  loading: "Loading",
  intervention: "Recovery surcharge and intervention",
  storage: "Storage",
  detention: "Detention",
  unloading: "Unloading",
  marketFees: "Market fees",
};

export function itemizeModeledBranch(
  branch: CounterfactualBranch
): ItemizedModeledCost[] {
  return (
    Object.entries(branch.costBreakdownInr) as Array<
      [keyof CounterfactualBranch["costBreakdownInr"], number]
    >
  ).map(([key, amountInr]) => ({
    component: COST_LABELS[key],
    amountInr,
    meaning: "modeled estimate",
  }));
}
