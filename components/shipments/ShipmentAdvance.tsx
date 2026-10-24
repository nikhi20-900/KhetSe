"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { ShipmentResponse } from "@/lib/contracts/shipment.contract";

export function nextNormalStatus(
  status: string
): "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | null {
  if (status === "BOOKED") return "DISPATCHED";
  if (status === "DISPATCHED") return "IN_TRANSIT";
  if (status === "IN_TRANSIT") return "DELIVERED";
  return null;
}

function problemDetail(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body &&
    typeof body.detail === "string"
  ) {
    return body.detail;
  }
  return fallback;
}

export function ShipmentAdvance({ initial }: { initial: ShipmentResponse }) {
  const [shipment, setShipment] = useState(initial);
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const next = nextNormalStatus(shipment.status);

  async function advance() {
    if (!next) return;
    if (next !== "DISPATCHED" && location.trim().length === 0) {
      setError("Enter the checkpoint name recorded for this event.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/shipments/${encodeURIComponent(shipment.shipmentId)}/transitions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            status: next,
            occurredAt: new Date(Date.now() + 1000).toISOString(),
            ...(next === "DISPATCHED" ? {} : { location: location.trim() }),
          }),
        }
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          problemDetail(body, `The shipment stayed ${shipment.status}.`)
        );
        return;
      }
      setShipment(body as ShipmentResponse);
      setLocation("");
    } catch {
      setError("The shipment transition could not be sent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-charcoal-950">
          Stored shipment
        </h2>
        <p className="text-sm leading-relaxed text-charcoal-600">
          Persisted status: {shipment.status}. Checkpoint text is recorded by
          this form. It is not a live location. This record is separate from the
          Igatpuri demonstration shipment.
        </p>
        <ul className="space-y-2 text-sm text-charcoal-800">
          {shipment.events.map((event) => (
            <li key={event.id}>
              {event.eventType} · {event.location ?? "No checkpoint"} ·{" "}
              {event.eventTime}
            </li>
          ))}
        </ul>
        {next ? (
          <div className="space-y-3">
            {next === "DISPATCHED" ? null : (
              <Input
                id="checkpoint"
                label="Checkpoint"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                hint="Use a demonstration place name. The service stores the text you enter."
              />
            )}
            <Button type="button" onClick={advance} disabled={pending}>
              {pending ? "Recording…" : `Record ${next}`}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-charcoal-600">
            The normal path has no further transition from {shipment.status}.
            Disruption of a stored shipment is not available on this screen.
          </p>
        )}
        {error ? (
          <p role="alert" className="text-sm text-terracotta-800">
            {error}
          </p>
        ) : null}
        <Button href={`/reports/${shipment.shipmentId}`} variant="secondary">
          Open shipment report
        </Button>
      </div>
    </Card>
  );
}
