export const FARMER_REPLAYS = [
  {
    id: "vashi-mandi",
    label: "Vashi mandi quote",
    href: "/farmer?replay=vashi-mandi",
    detail:
      "Registered nearby mandi. The preview ends after the modeled margin.",
  },
  {
    id: "pune-premium",
    label: "Pune premium quote",
    href: "/farmer?replay=pune-premium",
    detail:
      "Registered cold-van buyer. This replay opens the quote, not the photo step.",
  },
  {
    id: "breakdown",
    label: "Breakdown alternatives",
    href: "/farmer?replay=breakdown",
    detail:
      "Registered repair, cold-room reroute, and no action, with their modeled deltas.",
  },
] as const;

export type FarmerReplay = (typeof FARMER_REPLAYS)[number]["id"];

export function parseFarmerReplay(
  value: string | undefined
): FarmerReplay | null {
  if (!value) return null;
  const match = FARMER_REPLAYS.find((item) => item.id === value);
  return match ? match.id : null;
}
