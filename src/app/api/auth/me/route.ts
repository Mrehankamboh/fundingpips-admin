import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getSessionUser, errorMessage } from "@/lib/auth";

export async function GET() {
  try {
    const sql = getSql();
    const user = await getSessionUser(sql);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Session check failed") },
      { status: 500 }
    );
  }
}
