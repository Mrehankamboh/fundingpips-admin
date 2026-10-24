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
      SELECT id, challenge_name, account_size, price, leverage
      FROM challenge_prices
      ORDER BY challenge_name, account_size
    `;

    return NextResponse.json({
      ok: true,
      prices: rows.map((row) => ({
        id: String(row.id),
        name: String(row.challenge_name),
        size: Number(row.account_size),
        price: Number(row.price),
        leverage: String(row.leverage || "1:100"),
      })),
    });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Prices failed") },
      { status }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    await requireAdmin(sql);

    const body = (await req.json()) as { id?: string; price?: number };
    const id = String(body.id || "");
    const price = Number(body.price);
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json(
        { ok: false, error: "Choose a price." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid price." },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE challenge_prices
      SET price = ${price}
      WHERE id = ${id}
      RETURNING id
    `;
    if (!updated[0]) {
      return NextResponse.json(
        { ok: false, error: "Price was not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Update price failed") },
      { status }
    );
  }
}
