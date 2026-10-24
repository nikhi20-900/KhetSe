import type { PlanBreakdown } from "@/lib/contracts/plan.contract";
import type { MarketDestination, VehicleOption } from "@/lib/planning/catalog";
import type { ReceivingSchedule } from "@/lib/planning/schedule";

const LOSS_NUMERATOR = 12;
const LOSS_DENOMINATOR = 1_000;
const MINUTES_PER_DAY = 1_440;

/**
 * Saleable fraction after ambient loss of 1.2% per 24 hours.
 * Integer minutes keep the ratio exact for the demo windows.
 */
export function ambientSaleableFraction(uncooledHours: number): number {
  const minutes = Math.round(uncooledHours * 60);
  const denom = LOSS_DENOMINATOR * MINUTES_PER_DAY;
  const numer = denom - LOSS_NUMERATOR * minutes;
  if (numer <= 0) {
    return 0;
  }
  return numer / denom;
}

/** Gross proceeds in whole rupees. Quantity may be fractional kilograms. */
export function modeledGrossProceedsInr(
  quantityKg: number,
  uncooledHours: number,
  pricePerKg: number
): number {
  const minutes = Math.round(uncooledHours * 60);
  const denom = LOSS_DENOMINATOR * MINUTES_PER_DAY;
  const numer = denom - LOSS_NUMERATOR * minutes;
  if (numer <= 0) {
    return 0;
  }

  const grams = BigInt(Math.round(quantityKg * 1_000));
  const pricePaise = BigInt(Math.round(pricePerKg * 100));
  const product = grams * pricePaise * BigInt(numer);
  const divisor = 1_000n * 100n * BigInt(denom);
  return Number((product + divisor / 2n) / divisor);
}

export function transportCostInr(
  dispatchBaseCostInr: number,
  perKmRateInr: number,
  distanceKm: number
): number {
  return Math.round(dispatchBaseCostInr + perKmRateInr * distanceKm);
}

export function estimateDirectPlan(input: {
  quantityKg: number;
  market: MarketDestination;
  vehicle: VehicleOption;
  schedule: ReceivingSchedule;
}): PlanBreakdown {
  const uncooledHours =
    input.vehicle.thermal.kind === "reefer"
      ? input.schedule.waitHours
      : input.schedule.elapsedHours;
  const transportInr = transportCostInr(
    input.vehicle.dispatchBaseCostInr,
    input.vehicle.perKmRateInr,
    input.market.distanceKm
  );
  const handlingInr = 0;
  const storageInr = 0;
  const grossProceedsInr = modeledGrossProceedsInr(
    input.quantityKg,
    uncooledHours,
    input.market.gradeAPriceInrPerKg
  );
  const logisticsTotalInr = transportInr + handlingInr + storageInr;

  return {
    transportInr,
    handlingInr,
    storageInr,
    logisticsTotalInr,
    grossProceedsInr,
    netProceedsInr: grossProceedsInr - logisticsTotalInr,
    dispatchBaseCostInr: input.vehicle.dispatchBaseCostInr,
    perKmRateInr: input.vehicle.perKmRateInr,
    distanceKm: input.market.distanceKm,
    quantityKg: input.quantityKg,
    uncooledHours,
    priceInrPerKg: input.market.gradeAPriceInrPerKg,
    freightClassification: input.vehicle.classification,
    priceClassification: input.market.priceClassification,
    lossModel:
      input.vehicle.thermal.kind === "reefer"
        ? "ambient_wait_only"
        : "ambient_elapsed",
    saleableFraction: ambientSaleableFraction(uncooledHours),
  };
}
