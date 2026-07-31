import { NextResponse } from "next/server";
import { getSql } from "@/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await getSql()`select 1`;
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch {
    return NextResponse.json(
      { status: "unavailable", database: "error" },
      { status: 503 },
    );
  }
}
