"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Keys", terminalLabel: "KEYS", icon: "K" },
  { href: "/dashboard/logs", label: "Logs", terminalLabel: "LOGS", icon: "L" },
  { href: "/dashboard/settings", label: "Settings", terminalLabel: "CONF", icon: "S" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isTerminal = theme === "terminal";

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
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
        {isTerminal ? "Loading..." : "Loading..."}
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
          padding: isTerminal ? "8px 20px" : "12px 32px",
          borderBottom: "1px solid var(--border-subtle)",
          background: isTerminal ? "var(--bg-secondary)" : "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: isTerminal ? "13px" : "16px",
              fontWeight: 700,
              color: "var(--text-accent)",
              textDecoration: "none",
              letterSpacing: isTerminal ? "2px" : "-0.02em",
            }}
          >
            {isTerminal ? "$ locker" : "Locker"}
          </Link>

          <nav style={{ display: "flex", gap: isTerminal ? "4px" : "4px" }}>
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
                    padding: isTerminal ? "4px 10px" : "6px 14px",
                    borderRadius: isTerminal ? "3px" : "var(--radius-sm)",
                    fontFamily: "var(--font-body)",
                    fontSize: isTerminal ? "12px" : "13px",
                    fontWeight: 500,
                    color: isActive ? "var(--text-accent)" : "var(--text-secondary)",
                    background: isActive
                      ? isTerminal
                        ? "rgba(50,215,75,0.1)"
                        : "var(--bg-card-hover)"
                      : "transparent",
                    textDecoration: "none",
                    letterSpacing: isTerminal ? "1px" : "0.01em",
                    transition: `all var(--duration-fast) ease`,
                    border: isActive && isTerminal ? "1px solid var(--border-accent)" : "1px solid transparent",
                  }}
                >
                  {isTerminal ? item.terminalLabel : item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ThemeToggle />
          <span
            style={{
              color: "var(--text-tertiary)",
              fontSize: isTerminal ? "11px" : "12px",
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
              padding: isTerminal ? "3px 8px" : "4px 12px",
              borderRadius: isTerminal ? "3px" : "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: isTerminal ? "11px" : "12px",
              cursor: "pointer",
              letterSpacing: isTerminal ? "1px" : "0",
            }}
          >
            {isTerminal ? "EXIT" : "Logout"}
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main
        style={{
          flex: 1,
          padding: isTerminal ? "20px" : "32px",
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
