import { describe, expect, it } from "vitest";

import {
  resolveBuyerResponse,
  validateFarmerPhoto,
} from "@/lib/domain/farmer-photo";

describe("farmer desk photo and buyer decisions", () => {
  it("accepts image files and rejects absent or non-image files", () => {
    expect(
      validateFarmerPhoto({ name: "onions.jpg", type: "image/jpeg" })
    ).toBe("onions.jpg");
    expect(validateFarmerPhoto(null)).toBeNull();
    expect(validateFarmerPhoto({ name: "notes.txt", type: "text/plain" })).toBe(
      null
    );
    expect(validateFarmerPhoto({ name: "unknown", type: "" })).toBeNull();
  });

  it("requires a selected photo for acceptance and keeps rejection on the photo step", () => {
    expect(resolveBuyerResponse("accept", null)).toEqual({
      step: "photo",
      accepted: false,
      message: "Attach an image before accepting the buyer's terms.",
    });
    expect(resolveBuyerResponse("accept", "onions.jpg")).toEqual({
      step: "track",
      accepted: true,
      message: null,
    });
    expect(resolveBuyerResponse("decline", "onions.jpg")).toEqual({
      step: "photo",
      accepted: false,
      message: "The premium sale stops here. No cold van is assigned.",
    });
  });
});
