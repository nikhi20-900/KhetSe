"use client";

import { useState, type FormEvent } from "react";

import { DispatchHold } from "@/components/reservations/DispatchHold";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { buildReservationHandoffSchema } from "@/lib/planning/reservation-handoff";

export function ReservationHandoff({
  planId,
  harvestQuantityKg,
  availability = [],
}: {
  planId: string;
  harvestQuantityKg: number;
  availability?: Array<{ vehicleType: string; availableKg: number }>;
}) {
  const [allocatedKg, setAllocatedKg] = useState(String(harvestQuantityKg));
  const [lockDurationMinutes, setLockDurationMinutes] = useState("15");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    message: string;
  } | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResponse(null);
    const allocated = Number(allocatedKg);
    const minutes = Number(lockDurationMinutes);
    const parsed = buildReservationHandoffSchema(harvestQuantityKg).safeParse({
      planId,
      allocatedKg: allocated,
      lockDurationMinutes: minutes,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".") || "form";
        if (!next[path]) {
          next[path] = issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const result = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body: unknown = await result.json().catch(() => null);
      const message =
        body &&
        typeof body === "object" &&
        "message" in body &&
        typeof body.message === "string"
          ? body.message
          : body &&
              typeof body === "object" &&
              "detail" in body &&
              typeof body.detail === "string"
            ? body.detail
            : "The reservation service did not return a readable response.";
      setResponse({ status: result.status, message });
      const confirmedId =
        result.status === 201 &&
        body &&
        typeof body === "object" &&
        "reservationId" in body &&
        typeof body.reservationId === "string"
          ? body.reservationId
          : null;
      setReservationId(confirmedId);
    } catch {
      setResponse({
        status: 0,
        message: "The reservation request could not be sent.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <h2 className="text-lg font-semibold text-charcoal-950">
          Capacity reservation request
        </h2>
        <p className="text-sm leading-relaxed text-charcoal-600">
          This requests a temporary capacity hold for the selected plan. The
          hold expires if it is not used. The service refuses conflicting
          requests for the same kilograms.
        </p>
        {availability.length > 0 ? (
          <p className="text-sm leading-relaxed text-charcoal-700">
            Free capacity now:{" "}
            {availability
              .map(
                (slot) =>
                  `${slot.vehicleType} ${new Intl.NumberFormat("en-IN").format(slot.availableKg)} kg`
              )
              .join(", ")}
            . A hold larger than the free kilograms on its truck is refused.
          </p>
        ) : null}
        <Input
          id="allocatedKg"
          label="Allocated weight (kg)"
          inputMode="decimal"
          value={allocatedKg}
          error={errors.allocatedKg}
          onChange={(event) => setAllocatedKg(event.target.value)}
        />
        <Input
          id="lockDurationMinutes"
          label="Lock duration (minutes)"
          inputMode="numeric"
          value={lockDurationMinutes}
          error={errors.lockDurationMinutes}
          hint="The demo hold window is 5 to 120 minutes. The walkthrough uses 15."
          onChange={(event) => setLockDurationMinutes(event.target.value)}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Requesting the hold…" : "Request capacity reservation"}
        </Button>
        {response ? (
          <p
            role="alert"
            className={`rounded-md border p-3 text-sm leading-relaxed ${response.status === 201 ? "border-sage-300 bg-sage-50 text-sage-900" : "border-terracotta-300 bg-terracotta-50 text-terracotta-900"}`}
          >
            {response.status === 201
              ? "Capacity hold requested successfully."
              : `Capacity hold was not confirmed${response.status ? ` (HTTP ${response.status})` : ""}.`}{" "}
            {response.message}
          </p>
        ) : null}
      </form>
      {reservationId ? <DispatchHold reservationId={reservationId} /> : null}
    </Card>
  );
}
