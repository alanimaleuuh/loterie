import "server-only";
import { headers } from "next/headers";

export async function getRequestMeta() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const ip = (fwd?.split(",")[0] ?? h.get("x-real-ip") ?? "127.0.0.1").trim();
  const userAgent = (h.get("user-agent") ?? "").slice(0, 300);
  return { ip, userAgent };
}
