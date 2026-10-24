import { Button } from "@/components/ui/Button";

export function PlanSelector({
  href,
  planId,
  onSelect,
}: {
  href?: string;
  planId?: string;
  onSelect?: (planId: string) => void;
}) {
  if (href) {
    return (
      <Button href={href} className="w-full">
        Reserve this plan &rarr;
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => {
        if (planId) {
          onSelect?.(planId);
        }
      }}
    >
      Reserve this plan &rarr;
    </Button>
  );
}
