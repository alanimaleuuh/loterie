import { clsx } from "clsx";
import { percent } from "@/lib/format";

export function Progress({ sold, max, size = "md", tone = "brand" }: { sold: number; max: number; size?: "sm" | "md" | "lg"; tone?: "brand" | "ember" }) {
  const pct = percent(sold, max);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={sold}
      aria-label={`${sold} tickets vendus sur ${max}`}
      className={clsx("w-full overflow-hidden rounded-full bg-ink-100", size === "sm" ? "h-1.5" : size === "md" ? "h-2" : "h-3")}
    >
      <div
        className={clsx(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone === "ember" ? "bg-gradient-to-r from-ember-500 to-ember-600" : "bg-gradient-to-r from-brand-400 to-brand-600",
        )}
        style={{ width: `${Math.max(pct, sold > 0 ? 3 : 0)}%` }}
      />
    </div>
  );
}
