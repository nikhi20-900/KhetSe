import type { ShipmentStatus } from "@/lib/domain/recovery";
import { Badge } from "@/components/ui/Badge";

const tone: Record<ShipmentStatus, "sage" | "red" | "terracotta"> = {
  IN_TRANSIT: "sage",
  DISRUPTED: "red",
  REROUTED: "terracotta",
};

const label: Record<ShipmentStatus, string> = {
  IN_TRANSIT: "In transit",
  DISRUPTED: "Disrupted",
  REROUTED: "Rerouted",
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return <Badge tone={tone[status]}>{label[status]}</Badge>;
}
