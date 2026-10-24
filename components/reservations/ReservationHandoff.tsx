"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { buildReservationHandoffSchema } from "@/lib/planning/reservation-handoff";

export function ReservationHandoff({
  planId,
  harvestQuantityKg,
}: {
  planId: string;
  harvestQuantityKg: number;
}) {
  const [allocatedKg, setAllocatedKg] = useState(String(harvestQuantityKg));
  const [lockDurationMinutes, setLockDurationMinutes] = useState("15");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    message: string;
  } | null>(null);

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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Capacity reservation request
        </h2>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          This is the booking handoff for the selected plan. Transactional
          capacity locking is not available yet, so the reservation service
          still declines the hold.
        </p>
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
            className="text-sm leading-relaxed text-gray-800 dark:text-gray-200"
          >
            The capacity reservation service replied {response.status}.{" "}
            {response.message}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
