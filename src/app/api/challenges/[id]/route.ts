import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { AuthError, requireAdmin, errorMessage } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const ALLOWED = new Set(["active", "cancelled", "completed"]);

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { status?: string };
    const status = String(body.status || "").toLowerCase();

    if (!ALLOWED.has(status)) {
      return NextResponse.json(
        { ok: false, error: "Status must be active, cancelled, or completed" },
        { status: 400 }
      );
    }

    const sql = getSql();
    await ensureSchema(sql);
    await requireAdmin(sql);

    await sql`UPDATE challenges SET status = ${status} WHERE id = ${id}`;

    const rows = await sql`
      SELECT
        c.id, c.evaluation_type, c.account_size, c.platform, c.plan,
        c.fee, c.quantity, c.status, c.created_at, c.user_id,
        u.email AS user_email
      FROM challenges c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ${id}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Challenge not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      challenge: {
        id: String(row.id),
        user_email: String(row.user_email),
        evaluation_type: String(row.evaluation_type),
        account_size: Number(row.account_size),
        platform: String(row.platform || ""),
        plan: row.plan ? String(row.plan) : null,
        fee: Number(row.fee || 0),
        quantity: Number(row.quantity || 1),
        status: String(row.status),
        created_at: row.created_at,
      },
    });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Update challenge failed") },
      { status }
    );
  }
}
