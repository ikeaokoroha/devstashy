import { Badge } from "@/components/ui/badge";

// The small outline badge marking a Pro-only item type, in the sidebar and the
// New Item type picker.
export function ProBadge() {
  return (
    <Badge
      variant="outline"
      className="h-4 px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
    >
      PRO
    </Badge>
  );
}
