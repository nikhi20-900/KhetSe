import { z } from "zod";

const costBreakdownSchema = z
  .object({
    dispatch: z.number(),
    transport: z.number(),
    loading: z.number(),
    intervention: z.number(),
    storage: z.number(),
    detention: z.number(),
    unloading: z.number(),
    marketFees: z.number(),
  })
  .strict();

const financialBranchSchema = z.object({
  scenarioId: z.string(),
  marketId: z.string(),
  deliveredKg: z.number(),
  qualityFraction: z.number(),
  grade: z.string(),
  grossProceedsInr: z.number(),
  logisticsCostInr: z.number(),
  interventionCostInr: z.number(),
  netProceedsInr: z.number(),
  costBreakdownInr: costBreakdownSchema,
});

/** The report response fields currently documented in docs/API_CONTRACTS.md. */
export const shipmentReportSchema = z.object({
  reportId: z.string(),
  shipmentId: z.string(),
  status: z.string(),
  isSimulatedData: z.boolean(),
  financialModel: z.object({
    modelScope: z.literal("canonical-baseline"),
    recoveryScenarioId: z.string(),
    noActionScenarioId: z.string(),
    sharedPrefixSteps: z.number().int().nonnegative(),
    sharedPreIncidentCostInr: z.number(),
    roundingPolicy: z.string(),
    assumptions: z.array(z.string()),
    limitations: z.array(z.string()),
    recoveryBranch: financialBranchSchema,
    noActionBranch: financialBranchSchema,
    counterfactualDeltaInr: z.number(),
  }),
});

export type ShipmentReport = z.infer<typeof shipmentReportSchema>;

export type ReportRow = { section: string; item: string; value: string };

const unavailableValue = "Not provided by the current API contract";

function formatNumber(value: number, unit: string) {
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
  return unit === "INR" ? `₹${formatted}` : `${formatted} ${unit}`;
}

function roundInr(value: number) {
  return Number(value.toFixed(2));
}

function reconciliationRows(
  branchName: string,
  branch: ShipmentReport["financialModel"]["recoveryBranch"]
): ReportRow[] {
  const lineSum = roundInr(
    Object.values(branch.costBreakdownInr).reduce(
      (sum, amount) => sum + amount,
      0
    )
  );
  const costGap = roundInr(branch.logisticsCostInr - lineSum);
  const displayedNet = roundInr(
    branch.grossProceedsInr - branch.logisticsCostInr
  );
  const paiseGap = roundInr(branch.netProceedsInr - displayedNet);
  return [
    {
      section: "Modeled financial comparison",
      item: `${branchName} cost lines sum`,
      value: formatNumber(lineSum, "INR"),
    },
    {
      section: "Modeled financial comparison",
      item: `${branchName} cost-line reconciliation`,
      value:
        costGap === 0
          ? "The itemized cost lines add up to the logistics total."
          : `The itemized cost lines differ from the logistics total by ${formatNumber(costGap, "INR")} because each line and the total are rounded separately.`,
    },
    {
      section: "Modeled financial comparison",
      item: `${branchName} displayed gross minus logistics`,
      value: formatNumber(displayedNet, "INR"),
    },
    {
      section: "Modeled financial comparison",
      item: `${branchName} reference-net reconciliation`,
      value:
        paiseGap === 0
          ? "The reference net equals displayed gross minus displayed logistics."
          : `The reference net differs from displayed gross minus displayed logistics by ${formatNumber(paiseGap, "INR")}. It is rounded from the unrounded amounts. The delta uses the reference net.`,
    },
  ];
}

/** Single source for report values rendered in the UI and included in CSV. */
export function getShipmentReportRows(report: ShipmentReport): ReportRow[] {
  const rows: ReportRow[] = [
    { section: "Report", item: "Report ID", value: report.reportId },
    { section: "Report", item: "Shipment ID", value: report.shipmentId },
    {
      section: "Report",
      item: "Persisted shipment status",
      value: report.status,
    },
    {
      section: "Report",
      item: "Data classification",
      value: report.isSimulatedData
        ? "Synthetic demonstration data"
        : "Synthetic data not indicated by report",
    },
  ];

  for (const section of [
    "Harvest details",
    "Selected plan",
    "Shipment events",
    "Incidents",
    "Recovery decisions",
    "Delivery receipt",
    "Final outcome",
  ]) {
    rows.push({ section, item: "Availability", value: unavailableValue });
  }

  rows.push(
    {
      section: "Modeled financial comparison",
      item: "Model scope",
      value: `This compares the registered ${report.financialModel.recoveryScenarioId} and ${report.financialModel.noActionScenarioId} baseline scenarios. It does not reconstruct the stored shipment or a Pune delivery.`,
    },
    {
      section: "Modeled financial comparison",
      item: "Recovery scenario",
      value: report.financialModel.recoveryScenarioId,
    },
    {
      section: "Modeled financial comparison",
      item: "No-action scenario",
      value: report.financialModel.noActionScenarioId,
    },
    {
      section: "Modeled financial comparison",
      item: "Shared pre-incident cost",
      value: formatNumber(
        report.financialModel.sharedPreIncidentCostInr,
        "INR"
      ),
    }
  );

  for (const [branchName, branch] of [
    ["Recovery branch", report.financialModel.recoveryBranch],
    ["No-action branch", report.financialModel.noActionBranch],
  ] as const) {
    rows.push(
      {
        section: "Modeled financial comparison",
        item: `${branchName} delivered`,
        value: formatNumber(branch.deliveredKg, "kg"),
      },
      {
        section: "Modeled financial comparison",
        item: `${branchName} gross proceeds`,
        value: formatNumber(branch.grossProceedsInr, "INR"),
      },
      {
        section: "Modeled financial comparison",
        item: `${branchName} logistics cost`,
        value: formatNumber(branch.logisticsCostInr, "INR"),
      },
      {
        section: "Modeled financial comparison",
        item: `${branchName} intervention-tagged charges`,
        value: `${formatNumber(branch.interventionCostInr, "INR")}. These charges sit inside the logistics total. They are not added again. The intervention line is only the emergency surcharge.`,
      },
      {
        section: "Modeled financial comparison",
        item: `${branchName} net proceeds`,
        value: formatNumber(branch.netProceedsInr, "INR"),
      }
    );
    for (const [component, amount] of Object.entries(branch.costBreakdownInr)) {
      rows.push({
        section: "Modeled financial comparison",
        item: `${branchName} ${component}`,
        value: formatNumber(amount, "INR"),
      });
    }
    rows.push(...reconciliationRows(branchName, branch));
  }
  rows.push(
    {
      section: "Modeled financial comparison",
      item: "Counterfactual delta",
      value: formatNumber(report.financialModel.counterfactualDeltaInr, "INR"),
    },
    {
      section: "Modeled financial comparison",
      item: "Relationship to shipment status",
      value:
        "Modeled recovery and no-action outcomes do not replace the persisted shipment status.",
    },
    {
      section: "Assumptions and uncertainty",
      item: "Rounding",
      value: report.financialModel.roundingPolicy,
    }
  );
  for (const assumption of report.financialModel.assumptions) {
    rows.push({
      section: "Assumptions and uncertainty",
      item: "Assumption",
      value: assumption,
    });
  }
  for (const limitation of report.financialModel.limitations) {
    rows.push({
      section: "Assumptions and uncertainty",
      item: "Limitation",
      value: limitation,
    });
  }

  return rows;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function shipmentReportToCsv(report: ShipmentReport) {
  const rows = getShipmentReportRows(report);
  return [
    ["Section", "Item", "Value"],
    ...rows.map(({ section, item, value }) => [section, item, value]),
    [
      "Disclosure",
      "Data notice",
      "Synthetic data status is shown in the report; financial values are modeled estimates, not realized commercial outcomes.",
    ],
    [
      "Disclosure",
      "Limitations",
      "No guaranteed prices or live GPS telematics. Unavailable fields are omitted from the current API contract.",
    ],
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}
