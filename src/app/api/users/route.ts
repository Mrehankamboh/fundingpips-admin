import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { AuthError, requireAdmin, errorMessage } from "@/lib/auth";

export async function GET() {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    await requireAdmin(sql);

    const rows = await sql`
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.country, u.role, u.blocked, u.created_at,
        u.password_plain, u.password_hash,
        (SELECT count(*)::int FROM challenges c WHERE c.user_id = u.id) AS challenge_count,
        (SELECT coalesce(sum(c.fee * c.quantity), 0) FROM challenges c WHERE c.user_id = u.id) AS spent
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 500
    `;

    return NextResponse.json({
      ok: true,
      users: rows.map((row) => ({
        id: String(row.id),
        email: String(row.email),
        first_name: String(row.first_name || ""),
        last_name: String(row.last_name || ""),
        country: row.country,
        role: String(row.role || "user"),
        blocked: !!row.blocked,
        created_at: row.created_at,
        challenge_count: Number(row.challenge_count || 0),
        spent: Number(row.spent || 0),
        password: row.password_plain ? String(row.password_plain) : null,
        has_password: !!(row.password_hash || row.password_plain),
      })),
    });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Users failed") },
      { status }
    );
  }
}
