import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { Sql } from "./db";
import { ensureSchema } from "./schema";

export const COOKIE = "fp_session";

export type AdminUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country: string | null;
  role: "admin" | "user";
  created_at: Date | string;
};

export function verifyPassword(password: string, hash: string | null): boolean {
  if (!hash) return false;
  return bcrypt.compareSync(String(password), hash);
}

export function sessionCookieValue(token: string, maxAgeSec = 60 * 60 * 24 * 30) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: !!(process.env.VERCEL || process.env.NODE_ENV === "production"),
    maxAge: maxAgeSec,
  };
}

export function clearSessionCookieValue() {
  return {
    name: COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: !!(process.env.VERCEL || process.env.NODE_ENV === "production"),
    maxAge: 0,
  };
}

export async function createSession(sql: Sql, userId: string): Promise<string> {
  await ensureSchema(sql);
  const token = randomBytes(32).toString("hex");
  await sql`INSERT INTO sessions (token, user_id) VALUES (${token}, ${userId})`;
  return token;
}

export async function destroySession(sql: Sql, token: string | undefined) {
  if (!token) return;
  await ensureSchema(sql);
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

export async function userFromToken(
  sql: Sql,
  token: string | undefined
): Promise<AdminUser | null> {
  await ensureSchema(sql);
  if (!token) return null;
  const rows = await sql`
    SELECT u.id, u.email, u.first_name, u.last_name, u.country, u.role, u.blocked, u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || row.blocked) return null;
  return {
    id: String(row.id),
    email: String(row.email || ""),
    first_name: String(row.first_name || ""),
    last_name: String(row.last_name || ""),
    country: row.country ? String(row.country) : null,
    role: String(row.role || "user") === "admin" ? "admin" : "user",
    created_at: row.created_at as Date | string,
  };
}

export async function getSessionUser(sql: Sql): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  return userFromToken(sql, token);
}

export async function requireAdmin(sql: Sql): Promise<AdminUser> {
  const user = await getSessionUser(sql);
  if (!user || user.role !== "admin") {
    throw new AuthError("Admin only", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}
