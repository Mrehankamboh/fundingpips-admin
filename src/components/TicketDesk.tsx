"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  name: string;
  email: string;
  lastMessage: string;
  lastAuthor: string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

function stamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TicketDesk() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("open");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      setTickets(data.tickets || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    }
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(load, 8000);
    return () => window.clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    const ticket = tickets.find((item) => item.id === selected);
    if (ticket) setStatus(ticket.status);
    fetch(`/api/tickets?id=${selected}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]));
  }, [selected, tickets]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (filter !== "all" && ticket.status !== filter) return false;
      if (!needle) return true;
      return `${ticket.subject} ${ticket.name} ${ticket.email}`
        .toLowerCase()
        .includes(needle);
    });
  }, [tickets, filter, query]);

  const current = tickets.find((t) => t.id === selected) || null;

  async function send(nextStatus = status, message = reply) {
    if (!current || busy) return;
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: current.id,
          message,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNote(data.error || "Could not send");
        return;
      }
      if (message) setReply("");
      setStatus(nextStatus);
      setNote(message ? "Reply sent" : "Status saved");
      await load();
    } catch {
      setNote("Could not send");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    send();
  }

  return (
    <div className={`ticket-desk${selected ? " is-open" : ""}`}>
      <aside className="ticket-list">
        <div className="ticket-list-head">
          <input
            className="ticket-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets"
            aria-label="Search tickets"
          />
          <select
            className="select-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter"
          >
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="status-line error">{error}</p> : null}
        <div className="ticket-rows">
          {!visible.length ? (
            <p className="empty">No tickets in this list.</p>
          ) : (
            visible.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                className={`ticket-row${ticket.id === selected ? " is-selected" : ""}`}
                onClick={() => setSelected(ticket.id)}
              >
                <strong>{ticket.subject}</strong>
                <span className="ticket-row-meta">
                  <em className={`badge badge-${ticket.status === "open" ? "active" : ticket.status === "closed" ? "cancelled" : "completed"}`}>
                    {ticket.status.replace("_", " ")}
                  </em>
                  <em>{ticket.name}</em>
                </span>
                <span className="ticket-preview">
                  {ticket.lastMessage || "No messages yet"}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="ticket-thread">
        {!current ? (
          <p className="empty">Select a ticket to view messages.</p>
        ) : (
          <>
            <header className="ticket-thread-head">
              <button
                type="button"
                className="btn btn-ghost ticket-back"
                onClick={() => setSelected("")}
              >
                Back
              </button>
              <div>
                <h2>{current.subject}</h2>
                <p>
                  {current.name}
                  {current.email ? ` · ${current.email}` : ""}
                </p>
              </div>
              <select
                className="select-sm"
                value={status}
                onChange={(e) => send(e.target.value, "")}
              >
                {FILTERS.filter((f) => f.id !== "all").map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </header>
            <div className="ticket-messages">
              {messages.map((message) => {
                const out = message.author === "admin";
                return (
                  <article
                    key={message.id}
                    className={`bubble${out ? " bubble-admin" : ""}`}
                  >
                    <p>{message.body}</p>
                    <time>
                      {(out ? "Support" : "Trader") + " · " + stamp(String(message.createdAt))}
                    </time>
                  </article>
                );
              })}
            </div>
            <form className="ticket-reply" onSubmit={onSubmit}>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply"
                rows={3}
              />
              <div className="actions">
                <button
                  className="btn btn-primary"
                  style={{ width: "auto", padding: "10px 16px" }}
                  type="submit"
                  disabled={busy || !reply.trim()}
                >
                  Send
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={busy}
                  onClick={() => send("closed", "")}
                >
                  Close chat
                </button>
                {note ? <span className="hint">{note}</span> : null}
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
