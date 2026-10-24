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
        c.id, c.evaluation_type, c.account_size, c.platform, c.plan,
        c.fee, c.quantity, c.status, c.created_at, c.user_id,
        u.email AS user_email,
        u.first_name, u.last_name,
        u.password_plain, u.password_hash, u.google_id
      FROM challenges c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
      LIMIT 500
    `;

    return NextResponse.json({
      ok: true,
      challenges: rows.map((row) => ({
        id: String(row.id),
        user_id: String(row.user_id),
        user_email: String(row.user_email),
        first_name: String(row.first_name || ""),
        last_name: String(row.last_name || ""),
        evaluation_type: String(row.evaluation_type),
        account_size: Number(row.account_size),
        platform: String(row.platform || ""),
        plan: row.plan ? String(row.plan) : null,
        fee: Number(row.fee || 0),
        quantity: Number(row.quantity || 1),
        status: String(row.status || "active"),
        created_at: row.created_at,
        password: row.password_plain ? String(row.password_plain) : null,
        has_password: !!(row.password_hash || row.password_plain),
        auth_google: !!row.google_id && !row.password_hash && !row.password_plain,
      })),
    });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Challenges failed") },
      { status }
    );
  }
}
