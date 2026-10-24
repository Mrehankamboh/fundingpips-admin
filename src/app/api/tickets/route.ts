import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { AuthError, requireAdmin, errorMessage } from "@/lib/auth";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export async function GET(req: Request) {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    await requireAdmin(sql);

    const id = new URL(req.url).searchParams.get("id") || "";
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const messages = await sql`
        SELECT id, author, body, created_at
        FROM ticket_messages
        WHERE ticket_id = ${id}
        ORDER BY created_at ASC
      `;
      return NextResponse.json({
        ok: true,
        messages: messages.map((row) => ({
          id: String(row.id),
          author: String(row.author),
          body: String(row.body),
          createdAt: row.created_at,
        })),
      });
    }

    const tickets = await sql`
      SELECT t.id, t.subject, t.status, t.visitor_name, t.visitor_email,
        t.created_at, t.updated_at,
        coalesce(u.first_name || ' ' || u.last_name, '') AS account_name,
        (SELECT body FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT author FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_author
      FROM tickets t
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY t.updated_at DESC
      LIMIT 200
    `;

    return NextResponse.json({
      ok: true,
      tickets: tickets.map((row) => ({
        id: String(row.id),
        subject: String(row.subject),
        status: String(row.status),
        name: String(row.account_name || row.visitor_name || "Visitor").trim(),
        email: String(row.visitor_email || ""),
        lastMessage: String(row.last_message || ""),
        lastAuthor: String(row.last_author || ""),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Tickets failed") },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    const sql = getSql();
    await ensureSchema(sql);
    await requireAdmin(sql);

    const body = (await req.json()) as {
      id?: string;
      message?: string;
      status?: string;
      action?: string;
      messageId?: string;
    };
    const id = String(body.id || "");
    const message = String(body.message || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
    const status = STATUSES.includes(String(body.status))
      ? String(body.status)
      : "";

    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json(
        { ok: false, error: "Choose a ticket." },
        { status: 400 }
      );
    }

    const ticket = await sql`SELECT id FROM tickets WHERE id = ${id} LIMIT 1`;
    if (!ticket[0]) {
      return NextResponse.json(
        { ok: false, error: "Ticket was not found." },
        { status: 404 }
      );
    }

    if (String(body.action || "") === "delete") {
      const messageId = String(body.messageId || "");
      if (!/^[0-9a-f-]{36}$/i.test(messageId)) {
        return NextResponse.json(
          { ok: false, error: "Choose a message." },
          { status: 400 }
        );
      }
      const removed = await sql`
        DELETE FROM ticket_messages
        WHERE id = ${messageId} AND ticket_id = ${id} AND author = 'admin'
        RETURNING id
      `;
      if (!removed[0]) {
        return NextResponse.json(
          { ok: false, error: "That reply could not be removed." },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (message) {
      await sql`
        INSERT INTO ticket_messages (ticket_id, author, body)
        VALUES (${id}, 'admin', ${message})
      `;
    }
    await sql`
      UPDATE tickets
      SET updated_at = now(),
          status = ${status || "open"}
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof AuthError ? err.status : 500;
    return NextResponse.json(
      { ok: false, error: errorMessage(err, "Ticket update failed") },
      { status }
    );
  }
}
