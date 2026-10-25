import { FarmerDesk } from "@/components/farmer/FarmerDesk";
import { buildFarmerDesk } from "@/lib/domain/farmer-desk";
import { parseFarmerReplay } from "@/lib/domain/farmer-replay";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FarmerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requested = one(params.replay);
  const replay = parseFarmerReplay(requested);
  return (
    <FarmerDesk
      key={replay ?? "start"}
      desk={buildFarmerDesk()}
      replay={replay}
      rejectedReplay={Boolean(requested) && replay === null}
    />
  );
}
