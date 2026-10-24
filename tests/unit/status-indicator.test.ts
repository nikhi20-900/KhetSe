import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

describe("status indicator", () => {
  it("renders known operational statuses with their plain-language label", () => {
    const html = renderToStaticMarkup(
      createElement(StatusIndicator, { status: "REROUTED" })
    );
    expect(html).toContain("Rerouted");
  });

  it("preserves unknown statuses instead of presenting them as booked", () => {
    const html = renderToStaticMarkup(
      createElement(StatusIndicator, { status: "AWAITING_HANDOFF" })
    );
    expect(html).toContain("AWAITING HANDOFF");
    expect(html).not.toContain(">Booked<");
  });
});
