"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { FadingBorder } from "@/components/FadingBorder";
import Link from "next/link";

const PAGE_PADDING = 40;

const navItems = [
  { href: "/dashboard", label: "Keys", icon: "K" },
  { href: "/dashboard/logs", label: "Logs", icon: "L" },
  { href: "/dashboard/integrations", label: "Integrations", icon: "I" },
  { href: "/dashboard/settings", label: "Settings", icon: "S" },
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

  // Tab key cycles through dashboard pages
  const paths = navItems.map((n) => n.href);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      // Don't intercept Tab if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      const currentIdx = paths.indexOf(pathname);
      const nextIdx = e.shiftKey
        ? (currentIdx - 1 + paths.length) % paths.length
        : (currentIdx + 1) % paths.length;
      router.push(paths[nextIdx]);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

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
          background: "var(--bg-primary)",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Mesh gradient background */}
      <div className="mesh-gradient">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>

      {/* ── Top Bar ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `14px ${PAGE_PADDING}px`,
          borderBottom: "1px solid var(--border-subtle)",
          backdropFilter: "blur(20px)",
          background: "rgba(0,0,0,0.4)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
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

          <nav style={{ display: "flex", gap: "2px" }}>
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
                    padding: "7px 16px",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                    background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                    textDecoration: "none",
                    transition: "all 200ms ease",
                    position: "relative",
                  }}
                >
                  {item.label}
                  {isActive && (
                    <div style={{
                      position: "absolute",
                      bottom: -1,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "16px",
                      height: "2px",
                      borderRadius: "1px",
                      background: "#ffffff",
                    }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "100px",
              background: "rgba(255,255,255,0.04)",
              position: "relative",
            }}
          >
            <FadingBorder radius="100px" colorFaded="rgba(255,255,255,0.01)" />
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--success)",
              }}
            />
            <span
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                fontFamily: "var(--font-body)",
              }}
            >
              {user.email}
            </span>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 150ms ease",
              position: "relative",
            }}
          >
            <FadingBorder radius="var(--radius-sm)" colorFaded="rgba(255,255,255,0.01)" />
            Logout
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main
        style={{
          flex: 1,
          padding: `40px ${PAGE_PADDING}px`,
          maxWidth: "1100px",
          width: "100%",
          margin: "0 auto",
          position: "relative",
        }}
      >
        {children}
      </main>
    </div>
  );
}
