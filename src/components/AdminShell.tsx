"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  IconChallenges,
  IconDashboard,
  IconPricing,
  IconTickets,
  IconUsers,
} from "./NavIcons";

type Me = {
  email: string;
  first_name: string;
  last_name: string;
};

const NAV: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { href: "/", label: "Dashboard", Icon: IconDashboard },
  { href: "/users", label: "Users", Icon: IconUsers },
  { href: "/challenges", label: "Challenges", Icon: IconChallenges },
  { href: "/pricing", label: "Pricing", Icon: IconPricing },
  { href: "/tickets", label: "Tickets", Icon: IconTickets },
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/logo.svg" alt="FundingPips" />
          <span className="brand-tag">Admin</span>
        </div>
        <nav>
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const { Icon } = item;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${active ? " active" : ""}`}
                prefetch
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
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
