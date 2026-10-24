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
        (SELECT count(*)::int FROM users) AS accounts_created,
        (SELECT count(*)::int FROM challenges) AS all_orders,
        (SELECT count(*)::int FROM users WHERE created_at::date = current_date) AS today_signups,
        (SELECT count(*)::int FROM challenges WHERE status = 'active') AS active,
        (SELECT count(*)::int FROM challenges WHERE status = 'completed') AS completed,
        (SELECT count(*)::int FROM challenges WHERE status = 'cancelled') AS cancelled,
        (SELECT count(*)::int FROM users WHERE blocked) AS blocked,
        (SELECT count(*)::int FROM users WHERE role = 'admin') AS admins,
        (SELECT coalesce(sum(fee * quantity), 0) FROM challenges) AS total_spend,
        (SELECT count(*)::int FROM tickets) AS tickets,
        (SELECT count(*)::int FROM tickets WHERE status IN ('open', 'in_progress')) AS tickets_open,
        (SELECT count(*)::int FROM challenge_prices) AS price_rows
    `;

    const byType = await sql`
      SELECT
        coalesce(nullif(trim(evaluation_type), ''), 'Other') AS evaluation_type,
        coalesce(nullif(trim(plan), ''), '—') AS plan,
        count(*)::int AS n
      FROM challenges
      GROUP BY 1, 2
      ORDER BY n DESC
    `;

    const recent = await sql`
      SELECT id, email, first_name, last_name, country, role, blocked, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 500
    `;

    return NextResponse.json({
      ok: true,
      stats: {
        accounts_created: Number(totals?.accounts_created || 0),
        all_orders: Number(totals?.all_orders || 0),
        today_signups: Number(totals?.today_signups || 0),
        active: Number(totals?.active || 0),
        completed: Number(totals?.completed || 0),
        cancelled: Number(totals?.cancelled || 0),
        blocked: Number(totals?.blocked || 0),
        admins: Number(totals?.admins || 0),
        total_spend: Number(totals?.total_spend || 0),
        tickets: Number(totals?.tickets || 0),
        tickets_open: Number(totals?.tickets_open || 0),
        price_rows: Number(totals?.price_rows || 0),
        // keep legacy keys for safety
        user_count: Number(totals?.accounts_created || 0),
        challenge_count: Number(totals?.all_orders || 0),
      },
      by_type: byType.map((row) => ({
        evaluation_type: String(row.evaluation_type),
        plan: String(row.plan),
        count: Number(row.n || 0),
      })),
      recent_users: recent.map((u) => ({
        id: String(u.id),
        email: String(u.email),
        first_name: String(u.first_name || ""),
        last_name: String(u.last_name || ""),
        country: u.country,
        role: String(u.role || "user"),
        blocked: !!u.blocked,
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
