import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", demo: true });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
