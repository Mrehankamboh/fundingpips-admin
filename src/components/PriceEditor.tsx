"use client";

import { useCallback, useEffect, useState } from "react";

type PriceRow = {
  id: string;
  name: string;
  size: number;
  price: number;
  leverage: string;
};

export function PriceEditor() {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Loading…");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/prices", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      const list = data.prices as PriceRow[];
      setRows(list);
      setValues(Object.fromEntries(list.map((r) => [r.id, String(r.price)])));
      setStatus(`${list.length} prices`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setStatus("");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(id: string) {
    const nextPrice = Number(values[id]);
    if (!Number.isFinite(nextPrice)) {
      setNotes((n) => ({ ...n, [id]: "Enter a valid number" }));
      return;
    }
    setBusy(id);
    setNotes((n) => ({ ...n, [id]: "" }));
    try {
      const res = await fetch("/api/prices", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, price: nextPrice }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setNotes((n) => ({
          ...n,
          [id]: data.error || `Save failed (${res.status})`,
        }));
        return;
      }
      setRows((list) =>
        list.map((r) => (r.id === id ? { ...r, price: nextPrice } : r))
      );
      setNotes((n) => ({
        ...n,
        [id]: "Saved — live site updates on refresh",
      }));
    } catch {
      setNotes((n) => ({ ...n, [id]: "Network error — could not save" }));
    } finally {
      setBusy("");
    }
  }

  const names = [...new Set(rows.map((r) => r.name))];

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Challenge prices</h2>
        <span className="meta">{error || status}</span>
      </div>
      <p className="price-help">
        Edit a value then click <strong>Save</strong> on that row. Homepage
        pricing reads from the same Neon DB — hard-refresh the landing page
        after saving.
      </p>
      {error && !rows.length ? (
        <p className="status-line error">{error}</p>
      ) : !rows.length ? (
        <p className="empty">{status || "No prices yet."}</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Account size</th>
                <th>Leverage</th>
                <th>Price (USD)</th>
                <th></th>
              </tr>
            </thead>
            {names.map((name) => (
              <tbody key={name}>
                <tr className="group-label">
                  <td colSpan={4}>{name}</td>
                </tr>
                {rows
                  .filter((r) => r.name === name)
                  .map((row) => (
                    <tr key={row.id}>
                      <td>${row.size.toLocaleString("en-US")}</td>
                      <td>{row.leverage}</td>
                      <td>
                        <input
                          className="cell-input"
                          inputMode="decimal"
                          value={values[row.id] ?? ""}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [row.id]: e.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: "6px 10px", fontSize: 12 }}
                            disabled={busy === row.id}
                            onClick={() => save(row.id)}
                          >
                            {busy === row.id ? "Saving…" : "Save"}
                          </button>
                          {notes[row.id] ? (
                            <span className="hint">{notes[row.id]}</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  );
}
