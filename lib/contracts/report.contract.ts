import { z } from "zod";

const financialBranchSchema = z.object({
  deliveredKg: z.number(),
  grossProceedsInr: z.number(),
  logisticsCostInr: z.number(),
  netProceedsInr: z.number(),
});

/** The report response fields currently documented in docs/API_CONTRACTS.md. */
export const shipmentReportSchema = z.object({
  reportId: z.string(),
  shipmentId: z.string(),
  status: z.string(),
  isSimulatedData: z.boolean(),
  financialModel: z.object({
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
        item: `${branchName} net proceeds`,
        value: formatNumber(branch.netProceedsInr, "INR"),
      }
    );
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
    }
  );

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
