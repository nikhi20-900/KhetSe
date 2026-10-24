"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

export function InjectBreakdownButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function inject() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INJECT_BREAKDOWN", shipmentId }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (
        !response.ok ||
        !body ||
        typeof body !== "object" ||
        !("incident" in body)
      ) {
        const detail =
          body &&
          typeof body === "object" &&
          "detail" in body &&
          typeof body.detail === "string"
            ? body.detail
            : "The breakdown could not be injected.";
        setError(detail);
        return;
      }
      const incident = body.incident as { id?: string };
      router.push(
        incident.id ? `/incidents/${incident.id}` : `/shipments/${shipmentId}`
      );
      router.refresh();
    } catch {
      setError("The breakdown could not be injected.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="danger"
        onClick={() => void inject()}
        disabled={pending}
      >
        {pending
          ? "Injecting the breakdown…"
          : "Inject simulated breakdown at Igatpuri"}
      </Button>
      <p className="text-xs text-charcoal-500">
        This adds a modeled checkpoint incident. It does not move a vehicle or
        change the booking.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-terracotta-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
