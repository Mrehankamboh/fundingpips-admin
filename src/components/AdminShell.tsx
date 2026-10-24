"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Me = {
  email: string;
  first_name: string;
  last_name: string;
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/challenges", label: "Challenges" },
  { href: "/pricing", label: "Pricing" },
  { href: "/tickets", label: "Tickets" },
];

const META: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard",
    subtitle: "Users, challenges, and spend at a glance.",
  },
  "/users": {
    title: "Users",
    subtitle: "Signups, roles, block status, and spend.",
  },
  "/challenges": {
    title: "Challenges",
    subtitle: "Purchased evaluations and status.",
  },
  "/pricing": {
    title: "Pricing",
    subtitle: "Edit challenge prices — next purchase uses these values.",
  },
  "/tickets": {
    title: "Tickets",
    subtitle: "Support chats from traders and visitors.",
  },
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [checking, setChecking] = useState(true);

  const meta = useMemo(() => {
    const key =
      Object.keys(META)
        .filter((k) => k !== "/")
        .find((k) => pathname.startsWith(k)) || "/";
    return META[key] || META["/"];
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          router.replace("/login");
          return;
        }
        if (!cancelled) setMe(data.user);
      } catch {
        router.replace("/login");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    router.replace("/login");
  }, [router]);

  if (checking && !me) {
    return (
      <div className="login-page">
        <p className="status-line">Checking session…</p>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="mark">FP</div>
          <div>
            <strong>FundingPips</strong>
            <span>Admin</span>
          </div>
        </div>
        <nav>
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${active ? " active" : ""}`}
                prefetch
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-email">{me.email}</div>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
