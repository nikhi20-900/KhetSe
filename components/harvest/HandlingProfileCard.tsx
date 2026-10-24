import { Input } from "@/components/ui/Input";

export function HandlingProfileCard({
  temperatureMinC,
  temperatureMaxC,
  maxShelfLifeHours,
  temperatureMinError,
  temperatureMaxError,
  shelfLifeError,
  onTemperatureMinChange,
  onTemperatureMaxChange,
  onShelfLifeChange,
  onTemperatureMinBlur,
  onTemperatureMaxBlur,
  onShelfLifeBlur,
}: {
  temperatureMinC: string;
  temperatureMaxC: string;
  maxShelfLifeHours: string;
  temperatureMinError?: string;
  temperatureMaxError?: string;
  shelfLifeError?: string;
  onTemperatureMinChange: (value: string) => void;
  onTemperatureMaxChange: (value: string) => void;
  onShelfLifeChange: (value: string) => void;
  onTemperatureMinBlur: () => void;
  onTemperatureMaxBlur: () => void;
  onShelfLifeBlur: () => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-sand-300 bg-sand-50/40 p-4 dark:border-charcoal-700 dark:bg-charcoal-900/40">
      <fieldset>
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-charcoal-700 dark:text-linen-300">
          Temperature and preservation requirements
        </legend>
        <p
          id="handling-hint"
          className="mb-3 text-xs text-charcoal-500 dark:text-linen-400 leading-relaxed"
        >
          Nashik Red Onion is checked against a registered ambient band of
          24&ndash;32&deg;C. A declared band that does not overlap a vehicle is
          rejected as thermal incompatibility. The demonstration shelf-life
          horizon is 96 hours.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            id="temperatureMinC"
            label="Minimum temperature (°C)"
            inputMode="decimal"
            autoComplete="off"
            value={temperatureMinC}
            error={temperatureMinError}
            onChange={(event) => onTemperatureMinChange(event.target.value)}
            onBlur={onTemperatureMinBlur}
          />
          <Input
            id="temperatureMaxC"
            label="Maximum temperature (°C)"
            inputMode="decimal"
            autoComplete="off"
            value={temperatureMaxC}
            error={temperatureMaxError}
            onChange={(event) => onTemperatureMaxChange(event.target.value)}
            onBlur={onTemperatureMaxBlur}
          />
          <Input
            id="maxShelfLifeHours"
            label="Shelf-life horizon (hours)"
            inputMode="decimal"
            autoComplete="off"
            value={maxShelfLifeHours}
            error={shelfLifeError}
            onChange={(event) => onShelfLifeChange(event.target.value)}
            onBlur={onShelfLifeBlur}
          />
        </div>
      </fieldset>
    </div>
  );
}
