import type { RecoveryOption } from "@/lib/domain/recovery";
import { formatInr } from "@/lib/planning/format";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function RecoveryOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: RecoveryOption;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <Card
      className={
        selected ? "border-terracotta-500 ring-2 ring-terracotta-300" : ""
      }
      header={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={option.feasible ? "green" : "red"}>
            {option.feasible ? "Available" : option.rejection?.category}
          </Badge>
          <Badge tone="amber">{option.estimateLabel}</Badge>
        </div>
      }
    >
      <div className="space-y-2">
        <h3 className="text-base font-bold text-charcoal-950">
          {option.title}
        </h3>
        <p className="text-sm leading-relaxed text-charcoal-700">
          {option.summary}
        </p>
        {option.rejection ? (
          <p className="text-sm text-terracotta-800">
            {option.rejection.message}
          </p>
        ) : null}
        <p className="text-sm text-charcoal-800">
          {option.modeledCostInr === null
            ? "No recovery charge is estimated."
            : `Modeled recovery charge ${formatInr(option.modeledCostInr)}.`}
        </p>
        <p className="text-xs leading-relaxed text-charcoal-600">
          {option.costBasis}
        </p>
        <p className="text-xs leading-relaxed text-charcoal-600">
          {option.shelfLifeNote}
        </p>
        {option.changesReceivingWindow ? (
          <p className="text-xs font-semibold text-terracotta-800">
            This choice gives up the booked Vashi receiving window, so a buyer
            or manager must confirm it.
          </p>
        ) : null}
        {onSelect ? (
          <label className="mt-2 flex items-center gap-2 text-sm font-semibold">
            <input
              type="radio"
              name="recovery-option"
              value={option.id}
              checked={selected}
              disabled={!option.feasible}
              onChange={onSelect}
            />
            Select {option.title}
          </label>
        ) : null}
      </div>
    </Card>
  );
}
