import { SimulationLab } from "@/components/simulation/SimulationLab";
import { TransitClock } from "@/components/simulation/TransitClock";
import {
  SimulationLabError,
  type DisruptionId,
  type ResponseId,
} from "@/lib/domain/simulation-lab";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function disruptionFrom(value: string | undefined): DisruptionId {
  if (value === "none" || value === "breakdown" || value === "delay") {
    return value;
  }
  if (value === undefined) return "breakdown";
  throw new SimulationLabError("Unknown disruption.");
}

function responseFrom(value: string | undefined): ResponseId {
  if (
    value === "planned" ||
    value === "repair" ||
    value === "cold-recovery" ||
    value === "no-action" ||
    value === "negative-recovery" ||
    value === "delayed-continuation"
  ) {
    return value;
  }
  if (value === undefined) return "cold-recovery";
  throw new SimulationLabError("Unknown response.");
}

function optionalNumber(value: string | undefined) {
  if (value === undefined || value.trim() === "") return undefined;
  return Number(value);
}

export default async function SimulationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let disruptionId: DisruptionId = "breakdown";
  let responseId: ResponseId = "cold-recovery";
  let repairPauseHours: number | undefined;
  let recoverySurchargeInr: number | undefined;
  let error: string | null = null;
  try {
    disruptionId = disruptionFrom(one(params.disruption));
    responseId = responseFrom(one(params.response));
    repairPauseHours =
      responseId === "repair"
        ? optionalNumber(one(params.repairPauseHours))
        : undefined;
    recoverySurchargeInr =
      responseId === "cold-recovery" || responseId === "negative-recovery"
        ? optionalNumber(one(params.recoverySurchargeInr))
        : undefined;
  } catch (caught) {
    error =
      caught instanceof SimulationLabError
        ? caught.message
        : "The simulation request could not be read.";
  }

  return (
    <div className="space-y-10">
      {error ? (
        <p role="alert" className="text-sm text-terracotta-800">
          {error}
        </p>
      ) : (
        <SimulationLab
          disruptionId={disruptionId}
          responseId={responseId}
          repairPauseHours={repairPauseHours}
          recoverySurchargeInr={recoverySurchargeInr}
        />
      )}
      <TransitClock />
    </div>
  );
}
