export const BREAKDOWN_INJECT_NOTE =
  "Inject a breakdown adds the registered Nashik event to this demonstration. The registered rupee figures do not change. The control stays off until the Nashik marker.";

export function nashikMarkerIndex(points: readonly { label: string }[]) {
  const index = points.findIndex((point) =>
    point.label.includes("Nashik transfer checkpoint")
  );
  return index < 0 ? 0 : index;
}

export function canInjectBreakdown(
  checkpoint: number,
  markerIndex: number,
  alreadyInjected: boolean
) {
  return !alreadyInjected && checkpoint >= markerIndex;
}
