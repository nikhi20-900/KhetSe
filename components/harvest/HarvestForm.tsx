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
  referenceShelfLifeHours,
  bulkDensityKgPerM3,
  dispatchLabel,
}: {
  defaultHarvestLocal: string;
  referenceShelfLifeHours: number;
  bulkDensityKgPerM3: number;
  dispatchLabel: string;
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
  const [submitting, setSubmitting] = useState(false);

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
        | keyof HarvestFormValues
        | undefined;
      if (first) document.getElementById(FOCUS_IDS[first])?.focus();
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
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
    } catch {
      setSubmitError(
        "The harvest could not be saved. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const errorEntries = Object.entries(errors) as Array<
    [keyof HarvestFormValues, string]
  >;
  const quantity = Number(values.quantityKg);
  const quantityOk = Number.isFinite(quantity) && quantity > 0;
  const declaredShelf = Number(values.maxShelfLifeHours);
  const maxTemp = Number(values.temperatureMaxC);
  const handling =
    Number.isFinite(maxTemp) && maxTemp <= 8
      ? "Chilled handling declared"
      : "Dry, ventilated handling · No mandatory chilled transport";

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
      className="space-y-5"
    >
      {errorEntries.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4"
        >
          <p className="text-sm font-semibold text-red-900">Check these fields</p>
          <ul className="mt-2 space-y-1 text-sm text-red-800">
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <button
                  type="button"
                  className="text-left underline-offset-2 hover:underline"
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

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.8fr)]">
        <section className="rounded-2xl border border-khet-line bg-white p-5 sm:p-6">
          <h2 className="text-xl font-bold">Harvest details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              id="cropType"
              label="Crop"
              autoComplete="off"
              value={values.cropType}
              error={errors.cropType}
              onChange={(event) => onChange("cropType", event.target.value)}
              onBlur={() => onBlur("cropType")}
            />
            <Input
              id="quantityKg"
              label="Quantity (kg)"
              inputMode="decimal"
              autoComplete="off"
              value={values.quantityKg}
              error={errors.quantityKg}
              hint="Kilograms. The demonstration lot is 10,000 kg."
              onChange={(event) => onChange("quantityKg", event.target.value)}
              onBlur={() => onBlur("quantityKg")}
            />
            <Input
              id="originName"
              label="Origin"
              autoComplete="off"
              value={values.originName}
              error={errors.originName}
              onChange={(event) => onChange("originName", event.target.value)}
              onBlur={() => onBlur("originName")}
            />
            <Input
              id="harvestCompletedAt"
              label="Harvest completion"
              type="datetime-local"
              value={values.harvestCompletedAt}
              error={errors.harvestCompletedAt}
              onChange={(event) =>
                onChange("harvestCompletedAt", event.target.value)
              }
              onBlur={() => onBlur("harvestCompletedAt")}
            />
            <div className="space-y-1.5">
              <label
                htmlFor="dispatchTime"
                className="block text-sm font-semibold text-khet-ink"
              >
                Dispatch time
              </label>
              <input
                id="dispatchTime"
                readOnly
                value={dispatchLabel}
                className="min-h-11 w-full rounded-lg border border-khet-line bg-khet-sand px-3 text-sm"
              />
              <p className="text-xs text-khet-muted">
                Registered demo clock. This field is not a live booking time.
              </p>
            </div>
            <div className="sm:col-span-2">
              <QualityGradeSelector
                value={values.declaredQualityGrade}
                error={errors.declaredQualityGrade}
                onChange={(grade: QualityGrade) =>
                  onChange("declaredQualityGrade", grade)
                }
                onBlur={() => onBlur("declaredQualityGrade")}
              />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <p className="text-sm font-semibold">Handling requirement</p>
            <p className="rounded-lg border border-khet-line bg-white px-3 py-3 text-sm">
              {handling}
            </p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              id="latitude"
              label="Latitude"
              inputMode="decimal"
              value={values.latitude}
              error={errors.latitude}
              onChange={(event) => onChange("latitude", event.target.value)}
              onBlur={() => onBlur("latitude")}
            />
            <Input
              id="longitude"
              label="Longitude"
              inputMode="decimal"
              value={values.longitude}
              error={errors.longitude}
              onChange={(event) => onChange("longitude", event.target.value)}
              onBlur={() => onBlur("longitude")}
            />
          </div>
          <div className="mt-4">
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
              onShelfLifeChange={(value) => onChange("maxShelfLifeHours", value)}
              onTemperatureMinBlur={() => onBlur("temperatureMinC")}
              onTemperatureMaxBlur={() => onBlur("temperatureMaxC")}
              onShelfLifeBlur={() => onBlur("maxShelfLifeHours")}
            />
          </div>
          <p className="mt-4 rounded-xl bg-khet-sand px-4 py-3 text-sm text-khet-muted">
            The demo begins with the declared crop condition at dispatch.
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-khet-green"
            onClick={onRestoreDemo}
          >
            Restore demonstration lot
          </button>
        </section>

        <aside className="rounded-2xl border border-khet-mint bg-khet-mist p-5 sm:p-6">
          <div
            className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-khet-green"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M12 21V11"
                stroke="currentColor"
                strokeWidth="1.8"
                fill="none"
              />
              <path d="M12 14c0-4 3-6 6.5-6-1 4-3 6-6.5 6z" fill="currentColor" />
              <path d="M12 16c0-3-2.4-4.5-5-4.5 1 3 2.4 4.5 5 4.5z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Your harvest summary</h2>
          <dl className="mt-4 space-y-3">
            <Summary
              label="Lot weight"
              value={
                quantityOk
                  ? quantity % 1000 === 0
                    ? `${quantity / 1000} tonnes`
                    : `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(quantity / 1000)} tonnes`
                  : "—"
              }
            />
            <Summary
              label="Estimated volume"
              value={
                quantityOk
                  ? `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(quantity / bulkDensityKgPerM3)} m³`
                  : "—"
              }
            />
            <Summary
              label="Reference shelf life"
              value={`${referenceShelfLifeHours} hours`}
            />
            <Summary
              label="Condition"
              value={`Declared ${values.declaredQualityGrade || "—"}`}
            />
          </dl>
          {Number.isFinite(declaredShelf) &&
          declaredShelf !== referenceShelfLifeHours ? (
            <p className="mt-3 text-xs text-khet-muted">
              Declared horizon: {declaredShelf} hours. The reference shelf life
              is the demo crop profile.
            </p>
          ) : null}
          <p className="mt-4 text-sm text-khet-muted">
            Quality and shelf life are modeled from the demo inputs. Grade is
            not a certification.
          </p>
          {submitError ? (
            <p role="alert" className="mt-3 text-sm font-medium text-red-800">
              {submitError}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting} className="mt-5 w-full">
            {submitting ? "Saving harvest…" : "Find feasible plans →"}
          </Button>
        </aside>
      </div>
    </form>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-khet-muted">{label}</dt>
      <dd className="text-right text-sm font-bold tabular-nums">{value}</dd>
    </div>
  );
}
