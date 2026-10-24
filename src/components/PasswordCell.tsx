"use client";

import { useState } from "react";

type Props = {
  password: string | null;
  hasPassword?: boolean;
  authGoogle?: boolean;
};

export function PasswordCell({
  password,
  hasPassword = true,
  authGoogle = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (authGoogle || !hasPassword) {
    return <span className="pw-sso">Sign in with Google</span>;
  }

  if (!password) {
    return <span className="pw-muted">••••••••</span>;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(password!);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <span className="pw-cell">
      <span className="pw-value">{open ? password : "••••••••"}</span>
      <button
        type="button"
        className="pw-btn"
        title={copied ? "Copied" : "Copy password"}
        aria-label="Copy password"
        onClick={copy}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="9"
              y="9"
              width="11"
              height="11"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M5 15V7a2 2 0 0 1 2-2h8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="pw-btn"
        title={open ? "Hide password" : "Show password"}
        aria-label={open ? "Hide password" : "Show password"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 3l18 18M10.6 10.6A2 2 0 0 0 13.4 13.4M9.9 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.1 6.1C4.3 7.4 3 9.2 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        )}
      </button>
    </span>
  );
}
