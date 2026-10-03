import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/mon-compte", "/mes-participations", "/connexion", "/tirages/*/participer"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
