/**
 * Demo logistics register.
 * Distances, prices, payloads, and tariffs are copied from docs/assumptions.md.
 * Nothing in this file is a live market feed.
 */

export const DEMO_CROP_TYPE = "Nashik Red Onion";

export const DEMO_ORIGIN = {
  name: "Pimpalgaon Baswant, Nashik, Maharashtra",
  latitude: 20.1764,
  longitude: 73.9856,
} as const;

/** Identifies the registered farm gate. It is not a transport service radius. */
export const DEMO_ORIGIN_MATCH_RADIUS_KM = 10;

/**
 * Ambient ventilated baseline from assumptions.md §1.1:
 * 1.2% weight loss per 24 hours.
 */
export const AMBIENT_WEIGHT_LOSS_PER_24H = 0.012;

/** Numeric ambient band published for this onion profile in assumptions.md §1.1. */
export const AMBIENT_HANDLING_BAND_C = { min: 24, max: 32 } as const;

export interface MarketDestination {
  id: "vashi" | "pune" | "surat";
  name: string;
  distanceKm: number;
  transitHoursMin: number;
  transitHoursMax: number;
  receivingStart: string;
  receivingEnd: string;
  gradeAPriceInrPerKg: number;
  priceClassification: "EMPIRICAL_BENCHMARK";
}

export const MARKETS: readonly MarketDestination[] = [
  {
    id: "vashi",
    name: "Vashi APMC (Navi Mumbai)",
    distanceKm: 195,
    transitHoursMin: 5.5,
    transitHoursMax: 6.5,
    receivingStart: "02:00",
    receivingEnd: "06:00",
    gradeAPriceInrPerKg: 28,
    priceClassification: "EMPIRICAL_BENCHMARK",
  },
  {
    id: "pune",
    name: "Pune APMC (Gultekdi)",
    distanceKm: 215,
    transitHoursMin: 6,
    transitHoursMax: 7,
    receivingStart: "03:00",
    receivingEnd: "07:00",
    gradeAPriceInrPerKg: 31,
    priceClassification: "EMPIRICAL_BENCHMARK",
  },
  {
    id: "surat",
    name: "Surat APMC (Gujarat)",
    distanceKm: 240,
    transitHoursMin: 6.5,
    transitHoursMax: 7.5,
    receivingStart: "04:00",
    receivingEnd: "08:00",
    gradeAPriceInrPerKg: 26.5,
    priceClassification: "EMPIRICAL_BENCHMARK",
  },
];

export type ThermalCapability =
  { kind: "ambient" } | { kind: "reefer"; minC: number; maxC: number };

export interface VehicleOption {
  id: "standard_10t" | "ventilated_10t" | "reefer_7_5t";
  name: string;
  payloadKg: number;
  dispatchBaseCostInr: number;
  perKmRateInr: number;
  thermal: ThermalCapability;
  classification: "SIMULATED_DEMO_DATA";
  /**
   * Tie-break when two vehicles share one market transit window.
   * Lower wins Fastest Transit. Ventilated is first because assumptions.md
   * scenario A uses it on the shortest Vashi lane. The register does not
   * publish a separate speed for each vehicle.
   */
  fastestPreference: number;
}

export const VEHICLES: readonly VehicleOption[] = [
  {
    id: "standard_10t",
    name: "Standard 10-T Truck",
    payloadKg: 10_000,
    dispatchBaseCostInr: 3_500,
    perKmRateInr: 65,
    thermal: { kind: "ambient" },
    classification: "SIMULATED_DEMO_DATA",
    fastestPreference: 1,
  },
  {
    id: "ventilated_10t",
    name: "Ventilated 10-T Truck",
    payloadKg: 10_000,
    dispatchBaseCostInr: 4_500,
    perKmRateInr: 72,
    thermal: { kind: "ambient" },
    classification: "SIMULATED_DEMO_DATA",
    fastestPreference: 0,
  },
  {
    id: "reefer_7_5t",
    name: "Insulated Reefer Van",
    payloadKg: 7_500,
    dispatchBaseCostInr: 8_000,
    perKmRateInr: 110,
    thermal: { kind: "reefer", minC: 2, maxC: 8 },
    classification: "SIMULATED_DEMO_DATA",
    fastestPreference: 2,
  },
];

/** Onion cold-holding band from assumptions.md §1.1. Separate from ambient transit. */
export const ONION_COLD_STORAGE_BAND_C = { min: 0, max: 2 } as const;

export const DEMO_ROUTE_KM = 195;
export const DEMO_TRANSIT_HOURS = 6.5;
export const DEMO_BREAKDOWN_KM = 88;
