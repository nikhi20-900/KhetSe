import baseline from "@/data/demo-baseline.json";

const ventilated = baseline.vehicles.find(
  (vehicle) => vehicle.id === "ventilated-10t"
);
const standard = baseline.vehicles.find(
  (vehicle) => vehicle.id === "standard-10t"
);

if (!ventilated || !standard) {
  throw new Error(
    "data/demo-baseline.json is missing the ventilated or standard truck."
  );
}

/** Canonical simulated tariff. Slots and kilometres stay in baseline units. */
export const VENTILATED_SLOT_ID = ventilated.id;
export const VENTILATED_RATE_INR_PER_KM = ventilated.rateInrPerKm;
export const VENTILATED_FIXED_DISPATCH_INR = ventilated.fixedDispatchInr;
export const STANDARD_SLOT_ID = standard.id;

const edgeKm = new Map(
  baseline.edges.map((edge) => [edge.id, edge.distanceKm] as const)
);
const nodeName = new Map(
  baseline.nodes.map((node) => [node.id, node.name] as const)
);

function edgeDistance(id: string): number {
  const distance = edgeKm.get(id);
  if (distance === undefined) {
    throw new Error(`data/demo-baseline.json is missing edge ${id}.`);
  }
  return distance;
}

export interface BaselineRecoveryFacility {
  id: string;
  name: string;
  capacityKg: number;
  availableKg: number;
  distanceKm: number;
}

/** Storage choices the baseline can actually book. Distances are simulated edges. */
export const BASELINE_RECOVERY_FACILITIES: readonly BaselineRecoveryFacility[] =
  baseline.storageFacilities.map((facility) => ({
    id: facility.id,
    name: nodeName.get(facility.nodeId) ?? facility.id,
    capacityKg: facility.capacityKg,
    availableKg: facility.availableCapacityKg,
    distanceKm:
      facility.id === "nashik-demo-cold"
        ? edgeDistance("nashik-cold-intake")
        : edgeDistance("nashik-igatpuri") + edgeDistance("igatpuri-vashi"),
  }));

export function recoveryTransferCostInr(distanceKm: number): number {
  return (
    VENTILATED_FIXED_DISPATCH_INR + VENTILATED_RATE_INR_PER_KM * distanceKm
  );
}
