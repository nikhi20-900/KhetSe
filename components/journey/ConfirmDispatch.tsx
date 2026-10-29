"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConfirmDispatch({ href }: { href: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-khet-green px-4 text-sm font-semibold text-white hover:bg-khet-greenDark disabled:opacity-60"
        onClick={() => {
          if (pending) return;
          setPending(true);
          router.push(href);
        }}
      >
        {pending ? "Confirming demo dispatch…" : "Confirm & dispatch →"}
      </button>
      <p className="mt-2 text-center text-xs text-khet-muted">
        Preview action · no real booking or payment
      </p>
    </div>
  );
}
