"use client";

import { useCallback, useEffect, useState } from "react";
import { PasswordCell } from "@/components/PasswordCell";

type UserRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  country: string | null;
  role: string;
  blocked: boolean;
  challenge_count: number;
  spent: number;
  created_at: string;
  password: string | null;
  has_password: boolean;
};

export function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [status, setStatus] = useState("Loading…");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/users", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      setUsers(data.users);
      setStatus(`${data.users.length} users`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setStatus("");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: string, body: { blocked?: boolean; role?: string }) {
    setError("");
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
        <h2>Users</h2>
        <span className="meta">{error ? error : status}</span>
      </div>
      {error && !users.length ? (
        <p className="status-line error">{error}</p>
      ) : !users.length ? (
        <p className="empty">{status || "No users yet."}</p>
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
                <th>Status</th>
                <th>Challenges</th>
                <th>Spent</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                      "—"}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <PasswordCell
                      password={u.password}
                      hasPassword={u.has_password !== false}
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
                  <td>
                    {u.blocked ? (
                      <span className="badge badge-blocked">Blocked</span>
                    ) : (
                      <span className="badge badge-active">Active</span>
                    )}
                  </td>
                  <td>{u.challenge_count}</td>
                  <td>${Number(u.spent).toFixed(2)}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className={u.blocked ? "btn btn-ok" : "btn btn-danger"}
                        onClick={() => patch(u.id, { blocked: !u.blocked })}
                      >
                        {u.blocked ? "Unblock" : "Block"}
                      </button>
                      <select
                        className="select-sm"
                        value={u.role}
                        onChange={(e) => patch(u.id, { role: e.target.value })}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
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
