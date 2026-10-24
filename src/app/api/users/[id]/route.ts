import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { AuthError, requireAdmin, errorMessage } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      blocked?: boolean;
      role?: string;
    };

    const sql = getSql();
    await ensureSchema(sql);
    const me = await requireAdmin(sql);

    if (id === me.id && body.blocked === true) {
      return NextResponse.json(
        { ok: false, error: "Cannot block yourself" },
        { status: 400 }
      );
    }
    if (id === me.id && body.role === "user") {
      return NextResponse.json(
        { ok: false, error: "Cannot demote yourself" },
        { status: 400 }
      );
    }

    if (typeof body.blocked === "boolean") {
      await sql`UPDATE users SET blocked = ${body.blocked} WHERE id = ${id}`;
    }
    if (body.role === "admin" || body.role === "user") {
      await sql`UPDATE users SET role = ${body.role} WHERE id = ${id}`;
    }

    const rows = await sql`
      SELECT id, email, first_name, last_name, country, role, blocked, created_at
      FROM users WHERE id = ${id} LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: String(row.id),
        email: String(row.email),
        first_name: String(row.first_name || ""),
        last_name: String(row.last_name || ""),
        country: row.country,
        role: String(row.role || "user"),
        blocked: !!row.blocked,
        created_at: row.created_at,
      },
    });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Update user failed") },
      { status }
    );
  }
}
