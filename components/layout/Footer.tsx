import { cropProfile } from "@/lib/domain/baseline-journey";
import { formatKg } from "@/lib/planning/format";

export function Footer() {
  const crop = cropProfile();
  return (
    <footer className="mt-auto border-t border-khet-line bg-white px-4 py-3 text-xs text-khet-muted sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p>
          SIMULATED · {crop.name} · {formatKg(crop.quantityKg)}
        </p>
        <p>Design preview · Synthetic estimates, not realized income</p>
      </div>
    </footer>
  );
}
