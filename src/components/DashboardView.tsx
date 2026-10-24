"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PasswordCell } from "@/components/PasswordCell";

type Stats = {
  accounts_created: number;
  all_orders: number;
  today_signups: number;
  active: number;
  completed: number;
  cancelled: number;
  blocked: number;
  admins: number;
  total_spend: number;
  tickets: number;
  tickets_open: number;
  price_rows: number;
};

type TypeRow = {
  evaluation_type: string;
  plan: string;
  count: number;
};

type RecentUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country: string | null;
  role: string;
  blocked?: boolean;
  created_at: string;
  password?: string | null;
  has_password?: boolean;
  auth_google?: boolean;
};

type ChallengeRow = {
  id: string;
  user_email: string;
  evaluation_type: string;
  account_size: number;
  plan: string | null;
  fee: number;
  status: string;
  created_at: string;
  password?: string | null;
  has_password?: boolean;
  auth_google?: boolean;
};

type TicketRow = {
  id: string;
  subject: string;
  status: string;
  name: string;
  email: string;
  updatedAt: string;
};

type Pill = {
  id: string;
  label: string;
  value: string | number;
  tone?: "default" | "warn" | "ok" | "danger" | "accent";
  panel: "users" | "orders" | "tickets" | "pricing";
};

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function money(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatSize(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `$${n}`;
}

export function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [byType, setByType] = useState<TypeRow[]>([]);
  const [recent, setRecent] = useState<RecentUser[]>([]);
  const [orders, setOrders] = useState<ChallengeRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [activePill, setActivePill] = useState("accounts");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, ordersRes, ticketsRes, usersRes] = await Promise.all([
          fetch("/api/stats", { credentials: "same-origin" }),
          fetch("/api/challenges", { credentials: "same-origin" }),
          fetch("/api/tickets", { credentials: "same-origin" }),
          fetch("/api/users", { credentials: "same-origin" }),
        ]);
        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        const ticketsData = await ticketsRes.json();
        const usersData = await usersRes.json();
        if (!statsRes.ok || !statsData.ok) {
          throw new Error(statsData.error || "Failed");
        }
        setStats(statsData.stats);
        setByType(statsData.by_type || []);
        if (usersRes.ok && usersData.ok && Array.isArray(usersData.users)) {
          setRecent(usersData.users);
        } else {
          setRecent(statsData.recent_users || []);
        }
        if (ordersRes.ok && ordersData.ok) {
          setOrders(ordersData.challenges || []);
        }
        if (ticketsRes.ok && ticketsData.ok) {
          setTickets(ticketsData.tickets || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      }
    })();
  }, []);

  const pills = useMemo<Pill[]>(() => {
    if (!stats) return [];
    const typePills: Pill[] = byType.slice(0, 8).map((row) => ({
      id: `type-${row.evaluation_type}-${row.plan}`,
      label:
        row.plan && row.plan !== "—"
          ? `${row.evaluation_type} · ${row.plan}`
          : row.evaluation_type,
      value: fmt(row.count),
      panel: "orders" as const,
    }));

    return [
      {
        id: "accounts",
        label: "Accounts created",
        value: fmt(stats.accounts_created),
        panel: "users",
      },
      {
        id: "orders",
        label: "All orders",
        value: fmt(stats.all_orders),
        tone: "accent",
        panel: "orders",
      },
      {
        id: "today",
        label: "Today signups",
        value: fmt(stats.today_signups),
        panel: "users",
      },
      {
        id: "active",
        label: "Active",
        value: fmt(stats.active),
        tone: "ok",
        panel: "orders",
      },
      {
        id: "completed",
        label: "Completed / Passed",
        value: fmt(stats.completed),
        tone: "ok",
        panel: "orders",
      },
      {
        id: "cancelled",
        label: "Cancelled / Failed",
        value: fmt(stats.cancelled),
        tone: "danger",
        panel: "orders",
      },
      {
        id: "spend",
        label: "Paid (spend)",
        value: money(stats.total_spend),
        tone: "warn",
        panel: "orders",
      },
      {
        id: "tickets-open",
        label: "Open tickets",
        value: fmt(stats.tickets_open),
        tone: "warn",
        panel: "tickets",
      },
      {
        id: "tickets",
        label: "All tickets",
        value: fmt(stats.tickets),
        panel: "tickets",
      },
      {
        id: "pricing",
        label: "Price rows",
        value: fmt(stats.price_rows),
        panel: "pricing",
      },
      {
        id: "blocked",
        label: "Blocked",
        value: fmt(stats.blocked),
        tone: "danger",
        panel: "users",
      },
      {
        id: "admins",
        label: "Admins",
        value: fmt(stats.admins),
        panel: "users",
      },
      ...typePills,
    ];
  }, [stats, byType]);

  const selected = pills.find((p) => p.id === activePill) || pills[0];

  const filteredOrders = useMemo(() => {
    if (!selected || selected.panel !== "orders") return orders;
    if (activePill === "active") {
      return orders.filter((o) => o.status === "active");
    }
    if (activePill === "completed") {
      return orders.filter((o) => o.status === "completed");
    }
    if (activePill === "cancelled") {
      return orders.filter((o) => o.status === "cancelled");
    }
    if (activePill.startsWith("type-")) {
      const row = byType.find(
        (t) => `type-${t.evaluation_type}-${t.plan}` === activePill
      );
      if (!row) return orders;
      return orders.filter(
        (o) =>
          o.evaluation_type === row.evaluation_type &&
          (o.plan || "—") === row.plan
      );
    }
    return orders;
  }, [orders, selected, activePill, byType]);

  const filteredTickets = useMemo(() => {
    if (activePill === "tickets-open") {
      return tickets.filter(
        (t) => t.status === "open" || t.status === "in_progress"
      );
    }
    return tickets;
  }, [tickets, activePill]);

  const filteredUsers = useMemo(() => {
    if (activePill === "blocked") {
      return recent.filter((u) => !!u.blocked);
    }
    if (activePill === "admins") {
      return recent.filter((u) => u.role === "admin");
    }
    if (activePill === "today") {
      const today = new Date().toDateString();
      return recent.filter(
        (u) => new Date(u.created_at).toDateString() === today
      );
    }
    return recent;
  }, [recent, activePill]);

  if (error) {
    return <p className="status-line error">{error}</p>;
  }

  if (!stats) {
    return <p className="status-line">Loading dashboard…</p>;
  }

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Accounts created</div>
          <div className="value">{fmt(stats.accounts_created)}</div>
        </div>
        <div className="stat-card">
          <div className="label">All orders</div>
          <div className="value">{fmt(stats.all_orders)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Paid (spend)</div>
          <div className="value">{money(stats.total_spend)}</div>
        </div>
      </div>

      <div className="dash-pills" role="toolbar" aria-label="Dashboard filters">
        {pills.map((pill) => {
          const className = [
            "dash-pill",
            pill.tone && pill.tone !== "default" ? `dash-pill--${pill.tone}` : "",
            activePill === pill.id ? "is-on" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={pill.id}
              type="button"
              className={className}
              onClick={() => setActivePill(pill.id)}
            >
              <strong>{pill.label}</strong>
              <span>{pill.value}</span>
            </button>
          );
        })}
      </div>

      {selected?.panel === "users" ? (
        <div className="panel">
          <div className="panel-head">
            <h2>{selected.label}</h2>
            <Link href="/users" className="meta">
              View all →
            </Link>
          </div>
          {!filteredUsers.length ? (
            <p className="empty">No users in this filter.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Password</th>
                    <th>Country</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                          "—"}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <PasswordCell
                          password={u.password ?? null}
                          hasPassword={u.has_password !== false}
                          authGoogle={!!u.auth_google}
                        />
                      </td>
                      <td>{u.country || "—"}</td>
                      <td>
                        <span
                          className={`badge ${u.role === "admin" ? "badge-admin" : "badge-user"}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {selected?.panel === "orders" ? (
        <div className="panel">
          <div className="panel-head">
            <h2>{selected.label}</h2>
            <Link href="/challenges" className="meta">
              View all →
            </Link>
          </div>
          {!filteredOrders.length ? (
            <p className="empty">No orders in this filter.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Password</th>
                    <th>Size</th>
                    <th>Plan</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((c) => (
                    <tr key={c.id}>
                      <td>{c.user_email}</td>
                      <td>{c.evaluation_type}</td>
                      <td>
                        <PasswordCell
                          password={c.password ?? null}
                          hasPassword={c.has_password !== false}
                          authGoogle={!!c.auth_google}
                        />
                      </td>
                      <td>{formatSize(c.account_size)}</td>
                      <td>{c.plan || "—"}</td>
                      <td>${Number(c.fee).toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${c.status}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {selected?.panel === "tickets" ? (
        <div className="panel">
          <div className="panel-head">
            <h2>{selected.label}</h2>
            <Link href="/tickets" className="meta">
              View all →
            </Link>
          </div>
          {!filteredTickets.length ? (
            <p className="empty">No tickets in this filter.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t) => (
                    <tr key={t.id}>
                      <td>{t.subject}</td>
                      <td>{t.name}</td>
                      <td>{t.email || "—"}</td>
                      <td>{t.status.replace("_", " ")}</td>
                      <td>{new Date(t.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {selected?.panel === "pricing" ? (
        <div className="panel">
          <div className="panel-head">
            <h2>{selected.label}</h2>
            <Link href="/pricing" className="meta">
              Open pricing →
            </Link>
          </div>
          <p className="empty">
            {fmt(stats.price_rows)} FundingPips challenge price rows in Neon.
            Edit them on the Pricing page — homepage and checkout use the same
            values.
          </p>
        </div>
      ) : null}
    </>
  );
}
