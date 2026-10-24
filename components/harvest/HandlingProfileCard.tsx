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
    <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          Temperature and shelf life
        </legend>
        <p
          id="handling-hint"
          className="mb-3 text-xs text-gray-500 dark:text-gray-400"
        >
          Nashik Red Onion is checked against a registered ambient band of
          24–32°C. A declared band that does not overlap a vehicle is rejected
          as thermal incompatibility. The demonstration shelf-life horizon is 96
          hours.
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
