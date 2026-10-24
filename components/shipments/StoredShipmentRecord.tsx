import { ShipmentAdvance } from "@/components/shipments/ShipmentAdvance";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { databaseConfigured } from "@/lib/db/client";
import { ShipmentError, getShipment } from "@/lib/db/queries/shipments";

function Unavailable({ id, detail }: { id: string; detail: string }) {
  return (
    <div className="space-y-5">
      <PageHeader
        kicker="SHIPMENT RECORD"
        title="Shipment unavailable"
        description="A stored shipment id was requested, and the service could not load it."
      />
      <Card>
        <p className="mb-4 text-sm text-charcoal-600">
          No stored shipment is available for{" "}
          <span className="font-mono">{id}</span>. {detail}
        </p>
        <Button href="/shipments/demo-igatpuri">Open Igatpuri demo</Button>
      </Card>
    </div>
  );
}

export async function StoredShipmentRecord({ id }: { id: string }) {
  if (!databaseConfigured()) {
    return (
      <Unavailable
        id={id}
        detail="DATABASE_URL is not set, so the stored shipment cannot be read."
      />
    );
  }
  try {
    const shipment = await getShipment(id);
    return (
      <div className="space-y-5">
        <PageHeader
          kicker="STORED SHIPMENT"
          title={shipment.shipmentId}
          description="This is the PostgreSQL shipment. It is not the Igatpuri demonstration story."
        />
        <ShipmentAdvance initial={shipment} />
      </div>
    );
  } catch (error) {
    const detail =
      error instanceof ShipmentError
        ? error.message
        : "The stored shipment could not be read.";
    return <Unavailable id={id} detail={detail} />;
  }
}
