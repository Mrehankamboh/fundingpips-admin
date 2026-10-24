"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MOCK_RECENT_USERS, MOCK_STATS } from "@/lib/mock-data";

type Stats = {
  user_count: number;
  challenge_count: number;
  total_spend: number;
};

type RecentUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country: string | null;
  role: string;
  created_at: string;
};

const UI_ONLY = process.env.NEXT_PUBLIC_UI_ONLY === "1";

export function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(UI_ONLY ? MOCK_STATS : null);
  const [recent, setRecent] = useState<RecentUser[]>(
    UI_ONLY ? MOCK_RECENT_USERS : []
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (UI_ONLY) return;
    (async () => {
      try {
        const res = await fetch("/api/stats", { credentials: "same-origin" });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
        setStats(data.stats);
        setRecent(data.recent_users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      }
    })();
  }, []);

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
          <div className="label">Total users</div>
          <div className="value">{stats.user_count.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">Challenges</div>
          <div className="value">{stats.challenge_count.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total spend</div>
          <div className="value">
            ${stats.total_spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent signups</h2>
          <Link href="/users" className="meta">
            View all →
          </Link>
        </div>
        {!recent.length ? (
          <p className="empty">No users yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Country</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td>{u.email}</td>
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
    </>
  );
}
