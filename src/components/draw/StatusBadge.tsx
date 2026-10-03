import { Badge, type Tone } from "@/components/ui/Badge";
import { STATUS_META, type DisplayStatus } from "@/lib/draw-status";

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone as Tone} dot={status === "live" || status === "ending"} className={className}>
      {meta.label}
    </Badge>
  );
}
