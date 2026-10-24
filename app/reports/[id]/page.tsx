import { ShipmentReport } from "@/components/reports/ShipmentReport";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  return <ShipmentReport reportId={id} />;
}
