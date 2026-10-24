"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

export function ResetDemoButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function reset() {
    setPending(true);
    try {
      await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_DEMO" }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => void reset()}
      disabled={pending}
    >
      {pending ? "Resetting…" : "Reset simulated shipment"}
    </Button>
  );
}
