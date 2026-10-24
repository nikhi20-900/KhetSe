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
    return <Button href={href}>Reserve this plan</Button>;
  }

  return (
    <Button
      type="button"
      onClick={() => {
        if (planId) {
          onSelect?.(planId);
        }
      }}
    >
      Reserve this plan
    </Button>
  );
}
