"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QualityGrade } from "@/lib/contracts/harvest.contract";
import {
  createDemoFormValues,
  toHarvestIntake,
  type FieldErrors,
  type HarvestFormValues,
} from "@/lib/planning/intake-form";
import { HandlingProfileCard } from "@/components/harvest/HandlingProfileCard";
import { QualityGradeSelector } from "@/components/harvest/QualityGradeSelector";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const FIELD_LABELS: Record<keyof HarvestFormValues, string> = {
  cropType: "Crop type",
  quantityKg: "Harvest volume",
  originName: "Origin location",
  latitude: "Latitude",
  longitude: "Longitude",
  harvestCompletedAt: "Harvest completion time",
  declaredQualityGrade: "Declared quality grade",
  temperatureMinC: "Minimum temperature",
  temperatureMaxC: "Maximum temperature",
  maxShelfLifeHours: "Shelf-life horizon",
};

const FOCUS_IDS: Record<keyof HarvestFormValues, string> = {
  cropType: "cropType",
  quantityKg: "quantityKg",
  originName: "originName",
  latitude: "latitude",
  longitude: "longitude",
  harvestCompletedAt: "harvestCompletedAt",
  declaredQualityGrade: "declaredQualityGrade-Grade A",
  temperatureMinC: "temperatureMinC",
  temperatureMaxC: "temperatureMaxC",
  maxShelfLifeHours: "maxShelfLifeHours",
};

export function HarvestForm({
  defaultHarvestLocal,
}: {
  defaultHarvestLocal: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<HarvestFormValues>(() => ({
    ...createDemoFormValues(),
    harvestCompletedAt: defaultHarvestLocal,
  }));
  const [touched, setTouched] = useState<
    Partial<Record<keyof HarvestFormValues, boolean>>
  >({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parsed = toHarvestIntake(values, new Date());
  const allErrors = parsed.ok ? {} : parsed.errors;
  const errors: FieldErrors = {};
  for (const field of Object.keys(allErrors) as Array<
    keyof HarvestFormValues
  >) {
    if (showAllErrors || touched[field]) errors[field] = allErrors[field];
  }

  function onChange(field: keyof HarvestFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function onBlur(field: keyof HarvestFormValues) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function onRestoreDemo() {
    setValues({
      ...createDemoFormValues(),
      harvestCompletedAt: defaultHarvestLocal,
    });
    setTouched({});
    setShowAllErrors(false);
    setSubmitError(null);
  }

  async function onSubmit() {
    const result = toHarvestIntake(values, new Date());
    if (!result.ok) {
      setShowAllErrors(true);
      setSubmitError(null);
      const first = Object.keys(result.errors)[0] as
        keyof HarvestFormValues | undefined;
      if (first) document.getElementById(FOCUS_IDS[first])?.focus();
      return;
    }

    setSubmitError(null);
    const response = await fetch("/api/harvests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.intake),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail =
        body &&
        typeof body === "object" &&
        "detail" in body &&
        typeof body.detail === "string"
          ? body.detail
          : "The harvest could not be registered.";
      setSubmitError(detail);
      return;
    }
    const harvestId =
      body &&
      typeof body === "object" &&
      "harvestId" in body &&
      typeof body.harvestId === "string"
        ? body.harvestId
        : "";
    if (!harvestId) {
      setSubmitError("The harvest was saved without an id.");
      return;
    }
    router.push(`/plans?harvestId=${encodeURIComponent(harvestId)}`);
  }

  const errorEntries = Object.entries(errors) as Array<
    [keyof HarvestFormValues, string]
  >;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      {errorEntries.length > 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40"
        >
          <p className="text-sm font-semibold text-red-900 dark:text-red-100">
            Fix the highlighted fields before comparing plans.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-red-800 dark:text-red-200">
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <button
                  type="button"
                  className="underline-offset-2 hover:underline"
                  onClick={() =>
                    document.getElementById(FOCUS_IDS[field])?.focus()
                  }
                >
                  {FIELD_LABELS[field]}: {message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card>
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Crop and volume
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="cropType"
              label="Crop type"
              autoComplete="off"
              value={values.cropType}
              error={errors.cropType}
              hint="The demonstration register covers Nashik Red Onion."
              onChange={(event) => onChange("cropType", event.target.value)}
              onBlur={() => onBlur("cropType")}
            />
            <Input
              id="quantityKg"
              label="Harvest volume (kg)"
              inputMode="decimal"
              autoComplete="off"
              value={values.quantityKg}
              error={errors.quantityKg}
              hint="Whole or fractional kilograms. The demonstration lot is 10,000 kg."
              onChange={(event) => onChange("quantityKg", event.target.value)}
              onBlur={() => onBlur("quantityKg")}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Origin and timing
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="originName"
              label="Origin location"
              autoComplete="off"
              value={values.originName}
              error={errors.originName}
              hint="Distances are registered for Pimpalgaon Baswant."
              onChange={(event) => onChange("originName", event.target.value)}
              onBlur={() => onBlur("originName")}
            />
            <Input
              id="harvestCompletedAt"
              label="Harvest completion time"
              type="datetime-local"
              value={values.harvestCompletedAt}
              error={errors.harvestCompletedAt}
              hint="Within the past 7 days, or up to 30 days ahead. The demonstration clock is 06:00 tomorrow."
              onChange={(event) =>
                onChange("harvestCompletedAt", event.target.value)
              }
              onBlur={() => onBlur("harvestCompletedAt")}
            />
            <Input
              id="latitude"
              label="Latitude"
              inputMode="decimal"
              autoComplete="off"
              value={values.latitude}
              error={errors.latitude}
              hint="Pimpalgaon Baswant is 20.1764° N."
              onChange={(event) => onChange("latitude", event.target.value)}
              onBlur={() => onBlur("latitude")}
            />
            <Input
              id="longitude"
              label="Longitude"
              inputMode="decimal"
              autoComplete="off"
              value={values.longitude}
              error={errors.longitude}
              hint="Pimpalgaon Baswant is 73.9856° E."
              onChange={(event) => onChange("longitude", event.target.value)}
              onBlur={() => onBlur("longitude")}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Quality and handling
          </h2>
          <div className="space-y-5">
            <QualityGradeSelector
              value={values.declaredQualityGrade}
              error={errors.declaredQualityGrade}
              onChange={(grade: QualityGrade) =>
                onChange("declaredQualityGrade", grade)
              }
              onBlur={() => onBlur("declaredQualityGrade")}
            />
            <HandlingProfileCard
              temperatureMinC={values.temperatureMinC}
              temperatureMaxC={values.temperatureMaxC}
              maxShelfLifeHours={values.maxShelfLifeHours}
              temperatureMinError={errors.temperatureMinC}
              temperatureMaxError={errors.temperatureMaxC}
              shelfLifeError={errors.maxShelfLifeHours}
              onTemperatureMinChange={(value) =>
                onChange("temperatureMinC", value)
              }
              onTemperatureMaxChange={(value) =>
                onChange("temperatureMaxC", value)
              }
              onShelfLifeChange={(value) =>
                onChange("maxShelfLifeHours", value)
              }
              onTemperatureMinBlur={() => onBlur("temperatureMinC")}
              onTemperatureMaxBlur={() => onBlur("temperatureMaxC")}
              onShelfLifeBlur={() => onBlur("maxShelfLifeHours")}
            />
          </div>
        </div>
      </Card>

      {submitError ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit">Compare logistics plans</Button>
        <Button type="button" variant="secondary" onClick={onRestoreDemo}>
          Restore demonstration lot
        </Button>
      </div>
    </form>
  );
}
