import { ShipmentReport } from "@/components/reports/ShipmentReport";
import { CanonicalReport, ComparisonScreen } from "@/components/journey/RecoveryScreens";
import { CANONICAL_SHIPMENT_ID } from "@/lib/demo/constants";

interface ReportPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    view?: string;
    compare?: string;
    option?: string;
    market?: string;
    kg?: string;
  }>;
}

export default async function ReportPage({
  params,
  searchParams,
}: ReportPageProps) {
  const { id } = await params;
  if (id === CANONICAL_SHIPMENT_ID) {
    const query = await searchParams;
    if (query.view === "compare") {
      return <ComparisonScreen mode={query.compare} />;
    }
    return (
      <CanonicalReport option={query.option} market={query.market} kg={query.kg} />
    );
  }

  return <ShipmentReport reportId={id} />;
}
