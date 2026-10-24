"use client";

import { useCallback, useEffect, useState } from "react";

type ChallengeRow = {
  id: string;
  user_email: string;
  first_name: string;
  last_name: string;
  evaluation_type: string;
  account_size: number;
  platform: string;
  plan: string | null;
  fee: number;
  quantity: number;
  status: string;
  created_at: string;
};

function formatSize(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `$${n}`;
}

export function ChallengesTable() {
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [status, setStatus] = useState("Loading…");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/challenges", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      setRows(data.challenges);
      setStatus(`${data.challenges.length} challenges`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setStatus("");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setChallengeStatus(id: string, next: string) {
    setError("");
    const res = await fetch(`/api/challenges/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Update failed");
      return;
    }
    await load();
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Challenges</h2>
        <span className="meta">{error ? error : status}</span>
      </div>
      {error && !rows.length ? (
        <p className="status-line error">{error}</p>
      ) : !rows.length ? (
        <p className="empty">{status || "No challenges yet."}</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Size</th>
                <th>Plan</th>
                <th>Platform</th>
                <th>Fee</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.user_email}</td>
                  <td>{c.evaluation_type}</td>
                  <td>{formatSize(c.account_size)}</td>
                  <td>{c.plan || "—"}</td>
                  <td>{c.platform}</td>
                  <td>${Number(c.fee).toFixed(2)}</td>
                  <td>{c.quantity}</td>
                  <td>
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <select
                      className="select-sm"
                      value={c.status}
                      onChange={(e) => setChallengeStatus(c.id, e.target.value)}
                    >
                      <option value="active">active</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
