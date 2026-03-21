"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LockerLogo, GitHubIcon } from "@/components/Icons";
import Link from "next/link";

const PAGE_PADDING = 40;

const navItems = [
  { href: "/dashboard", label: "Keys" },
  { href: "/dashboard/logs", label: "Logs" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Top Bar ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `12px ${PAGE_PADDING}px`,
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <LockerLogo size={22} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Locker
            </span>
          </Link>

          <nav style={{ display: "flex", gap: "4px" }}>
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: isActive ? "var(--text-accent)" : "var(--text-secondary)",
                    background: isActive ? "var(--bg-card-hover)" : "transparent",
                    textDecoration: "none",
                    transition: `all var(--duration-fast) ease`,
                    border: "1px solid transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side — consistent right edge with PAGE_PADDING */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              color: "var(--text-tertiary)",
              fontSize: "12px",
              fontFamily: "var(--font-body)",
            }}
          >
            {user.email}
          </span>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            style={{
              padding: "4px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main
        style={{
          flex: 1,
          padding: `32px ${PAGE_PADDING}px`,
          maxWidth: "1100px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
