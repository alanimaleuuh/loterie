import { clsx } from "clsx";

/** Visuel de lot (SVG de démo ou photo envoyée). <img> natif : compatible SVG + uploads dynamiques. */
export function LotImage({ src, alt, className, priority }: { src?: string | null; alt: string; className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? "/lots/placeholder.svg"}
      alt={alt}
      className={clsx("h-full w-full object-cover", className)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
