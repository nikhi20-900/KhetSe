/**
 * Database Seed Script (Placeholder)
 *
 * Planned Scope:
 * Once the database schema is migrated, this script will populate baseline demonstration data:
 * 1. Demo Crop: Nashik Red Onion (10,000 kg profile, Pimpalgaon origin).
 * 2. Terminal Markets: Vashi APMC, Pune APMC, Surat APMC with receiving slots and pricing matrices.
 * 3. Transport Options: Standard 10T truck, Ventilated truck, Reefer van.
 * 4. Intermediate Storage: Pimpalgaon Cold Storage, Nashik Pre-Cooling Centre.
 * 5. Pre-configured Resettable Demo Scenarios (Normal, Breakdown Recovery, Delay No-Action, Negative Recovery).
 *
 * Tracked in:
 * - GitHub Issue #1 (Define demo crop, region, and evidence register)
 * - GitHub Issue #8 (Create shipment report, export, and resettable scenarios)
 *
 * Notice: This seed script is intentionally a placeholder. No fake database records are inserted.
 */

async function main() {
  console.log(
    "================================================================="
  );
  console.log("KhetSe Database Seed: Scaffold Placeholder");
  console.log(
    "================================================================="
  );
  console.log(
    "Baseline scenario data will be seeded upon completion of Issue #1 and #8."
  );
  console.log("No synthetic database writes were performed.");
}

main().catch((e) => {
  console.error("Seed placeholder notice:", e);
  process.exit(1);
});
