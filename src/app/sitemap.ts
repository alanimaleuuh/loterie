import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { SITE } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [draws, cats] = await Promise.all([
    db.draw.findMany({ where: { status: { not: "DISABLED" }, product: { status: "ACTIVE" } }, select: { id: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
  ]);
  const staticPages = ["", "/tirages", "/gagnants", "/comment-ca-marche", "/reglement", "/faq", "/inscription", "/mentions-legales", "/cgu", "/confidentialite"];
  return [
    ...staticPages.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.6 })),
    ...cats.map((c) => ({ url: `${SITE.url}/categories/${c.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...draws.map((d) => ({ url: `${SITE.url}/tirages/${d.id}`, lastModified: d.updatedAt, changeFrequency: "hourly" as const, priority: 0.8 })),
  ];
}
