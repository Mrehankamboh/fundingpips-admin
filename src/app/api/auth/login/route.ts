import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import {
  verifyPassword,
  createSession,
  sessionCookieValue,
  errorMessage,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password required" },
        { status: 400 }
      );
    }

    const sql = getSql();
    await ensureSchema(sql);

    const rows = await sql`
      SELECT id, email, password_hash, first_name, last_name, country, role, blocked
      FROM users
      WHERE lower(email) = ${email}
      LIMIT 1
    `;
    const user = rows[0];
    if (!user || user.blocked) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }
    if (!user.password_hash) {
      return NextResponse.json(
        {
          ok: false,
          error: "Password reset required. Use Forgot Password on the main site.",
        },
        { status: 401 }
      );
    }
    if (!verifyPassword(password, String(user.password_hash))) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const adminEmail = String(process.env.ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();
    let role = String(user.role || "user");
    if (adminEmail && email === adminEmail && role !== "admin") {
      await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id}`;
      role = "admin";
    }
    if (role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Admin only. Set ADMIN_EMAIL to your account email." },
        { status: 403 }
      );
    }

    const token = await createSession(sql, String(user.id));
    const res = NextResponse.json({
      ok: true,
      user: {
        id: String(user.id),
        email: String(user.email),
        first_name: String(user.first_name || ""),
        last_name: String(user.last_name || ""),
        country: user.country,
        role: "admin",
      },
    });
    res.cookies.set(sessionCookieValue(token));
    return res;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Login failed") },
      { status: 500 }
    );
  }
}
