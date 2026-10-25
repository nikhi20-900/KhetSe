export type FarmerPhotoFile = Pick<File, "name" | "type">;

export function validateFarmerPhoto(
  file: FarmerPhotoFile | null | undefined
): string | null {
  if (
    !file ||
    !file.name.trim() ||
    !file.type.toLowerCase().startsWith("image/")
  ) {
    return null;
  }
  return file.name;
}

export function resolveBuyerResponse(
  response: "accept" | "decline",
  photoName: string | null
): {
  step: "photo" | "track";
  accepted: boolean;
  message: string | null;
} {
  if (response === "decline") {
    return {
      step: "photo",
      accepted: false,
      message: "The premium sale stops here. No cold van is assigned.",
    };
  }
  if (!photoName) {
    return {
      step: "photo",
      accepted: false,
      message: "Attach an image before accepting the buyer's terms.",
    };
  }
  return { step: "track", accepted: true, message: null };
}
