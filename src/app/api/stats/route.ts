import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { AuthError, requireAdmin, errorMessage } from "@/lib/auth";

export async function GET() {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    await requireAdmin(sql);

    const [totals] = await sql`
      SELECT
        (SELECT count(*)::int FROM users) AS user_count,
        (SELECT count(*)::int FROM challenges) AS challenge_count,
        (SELECT coalesce(sum(fee * quantity), 0) FROM challenges) AS total_spend
    `;

    const recent = await sql`
      SELECT id, email, first_name, last_name, country, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 8
    `;

    return NextResponse.json({
      ok: true,
      stats: {
        user_count: Number(totals?.user_count || 0),
        challenge_count: Number(totals?.challenge_count || 0),
        total_spend: Number(totals?.total_spend || 0),
      },
      recent_users: recent.map((u) => ({
        id: String(u.id),
        email: String(u.email),
        first_name: String(u.first_name || ""),
        last_name: String(u.last_name || ""),
        country: u.country,
        role: String(u.role || "user"),
        created_at: u.created_at,
      })),
    });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Stats failed") },
      { status }
    );
  }
}
