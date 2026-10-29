"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ApprovalPanel({
  backHref,
  nextHref,
}: {
  backHref: string;
  nextHref: string;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <div className="mt-5 border-t border-khet-line pt-4">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-khet-green"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <span>I have reviewed the costs and modeled outcome of this recovery.</span>
      </label>
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-khet-line px-4 text-sm font-semibold"
        >
          Back to options →
        </Link>
        <button
          type="button"
          disabled={!checked || pending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-khet-green px-5 text-sm font-semibold text-white hover:bg-khet-greenDark disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            if (!checked || pending) return;
            setPending(true);
            router.push(nextHref);
          }}
        >
          {pending ? "Recording demo approval…" : "Approve recovery →"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-khet-muted">
        Design preview · approval does not reserve real resources.
      </p>
    </div>
  );
}
