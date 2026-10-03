import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processDueDraws } from "@/server/draws/engine";

/** Déclencheur externe (cron) : POST avec l'en-tête Authorization: Bearer <CRON_SECRET> */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || auth.length !== expected.length || !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const processed = await processDueDraws();
  return NextResponse.json({ processed });
}
