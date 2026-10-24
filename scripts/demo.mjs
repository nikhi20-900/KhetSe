import { loadBaseline, loadEvidence } from "./reference-model.mjs";
import { validateDemo } from "./validate-demo.mjs";

const results = validateDemo(await loadBaseline(), await loadEvidence());
console.log(
  "SIMULATED demonstration outputs — not live prices, measured spoilage or guaranteed returns."
);
console.table(
  results.map(
    ({
      id,
      grade,
      completionHours,
      grossProceedsInr,
      totalCostsInr,
      netProceedsInr,
      incrementalNetInr,
    }) => ({
      scenario: id,
      grade,
      hours: completionHours,
      grossInr: grossProceedsInr,
      costsInr: totalCostsInr,
      netInr: netProceedsInr,
      deltaVsNoActionInr: incrementalNetInr ?? "n/a",
    })
  )
);
