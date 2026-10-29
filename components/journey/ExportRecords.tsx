"use client";

import { useState } from "react";

export function ExportRecords({
  files,
}: {
  files: { title: string; meta: string; filename: string; content: string }[];
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const active = files.find((file) => file.filename === preview);

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <article
          key={file.filename}
          className="flex items-center justify-between gap-3 rounded-2xl border border-khet-line px-4 py-3"
        >
          <div className="min-w-0">
            <h3 className="font-semibold">{file.title}</h3>
            <p className="text-sm text-khet-muted">{file.meta}</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-khet-mint px-3 py-1 text-sm font-semibold text-khet-green"
            onClick={() => setPreview(file.filename)}
          >
            Preview
          </button>
        </article>
      ))}
      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-preview-title"
          className="rounded-2xl border border-khet-line bg-khet-sand p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="export-preview-title" className="font-semibold">
              {active.title}
            </h3>
            <button
              type="button"
              className="text-sm font-semibold"
              onClick={() => setPreview(null)}
            >
              Close
            </button>
          </div>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
            {active.content}
          </pre>
          <button
            type="button"
            className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-khet-green px-3 text-sm font-semibold text-white"
            onClick={() => download(active.filename, active.content)}
          >
            Download {active.filename}
          </button>
        </div>
      ) : null}
    </div>
  );
}
