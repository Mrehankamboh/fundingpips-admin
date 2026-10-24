import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import {
  COOKIE,
  destroySession,
  clearSessionCookieValue,
  errorMessage,
} from "@/lib/auth";

export async function POST() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    const sql = getSql();
    await destroySession(sql, token);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(clearSessionCookieValue());
    return res;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Logout failed") },
      { status: 500 }
    );
  }
}
