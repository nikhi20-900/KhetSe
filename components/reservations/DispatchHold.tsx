"use client";

import { useState } from "react";

import { ShipmentAdvance } from "@/components/shipments/ShipmentAdvance";
import { Button } from "@/components/ui/Button";
import type { ShipmentResponse } from "@/lib/contracts/shipment.contract";

export function DispatchHold({ reservationId }: { reservationId: string }) {
  const [shipment, setShipment] = useState<ShipmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function dispatchHold() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reservationId,
          dispatchedAt: new Date(Date.now() + 5000).toISOString(),
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail =
          body &&
          typeof body === "object" &&
          "detail" in body &&
          typeof body.detail === "string"
            ? body.detail
            : "The hold was not dispatched.";
        setError(detail);
        return;
      }
      setShipment(body as ShipmentResponse);
    } catch {
      setError("The dispatch request could not be sent.");
    } finally {
      setPending(false);
    }
  }

  if (shipment) return <ShipmentAdvance initial={shipment} />;

  return (
    <div className="space-y-3 border-t border-sand-200 pt-4">
      <p className="text-sm leading-relaxed text-charcoal-600">
        Reservation {reservationId} is confirmed. Dispatch records BOOKED and
        DISPATCHED on that hold. It does not start the separate Igatpuri story.
      </p>
      <Button type="button" onClick={dispatchHold} disabled={pending}>
        {pending ? "Dispatching…" : "Dispatch this hold"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-terracotta-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
