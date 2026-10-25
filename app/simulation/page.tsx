import { ControlRoom } from "@/components/simulation/ControlRoom";
import { TransitClock } from "@/components/simulation/TransitClock";
import { buildControlRoom } from "@/lib/domain/simulation-control-room";
import { SimulationLabError } from "@/lib/domain/simulation-lab";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
  try {
    const preview = buildControlRoom({
      cropType: one(params.cropType),
      quantityKg: optionalNumber(one(params.quantityKg)),
      originId: one(params.originId),
      destinationId: one(params.destinationId),
      vehicleId: one(params.vehicleId),
      delayHours: optionalNumber(one(params.delayHours)),
      temperatureExcursionHours: optionalNumber(
        one(params.temperatureExcursionHours)
      ),
    });
    return (
      <div className="space-y-10">
        <ControlRoom preview={preview} />
        <TransitClock />
      </div>
    );
  } catch (error) {
    const message =
      error instanceof SimulationLabError
        ? error.message
        : "The simulation preview could not be calculated.";
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-terracotta-800">
          {message}
        </p>
        <a className="text-sm text-terracotta-700 underline" href="/simulation">
          Return to the default 10,000 kg Nashik preview
        </a>
      </div>
    );
  }
}
