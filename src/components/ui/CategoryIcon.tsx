import { CookingPot, Laptop, Smartphone, Lamp, Sofa, Sparkles, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "cooking-pot": CookingPot,
  laptop: Laptop,
  smartphone: Smartphone,
  lamp: Lamp,
  sofa: Sofa,
  sparkles: Sparkles,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
