"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function RegisterPage() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const isTerminal = theme === "terminal";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      login(data.token, data.user);
      router.push("/dashboard");
    } catch {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: isTerminal ? "8px 12px" : "12px 16px",
    borderRadius: isTerminal ? "4px" : "var(--radius-md)",
    border: `1px solid var(--border-medium)`,
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: isTerminal ? "13px" : "14px",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    color: "var(--text-secondary)",
    fontFamily: "var(--font-body)",
    fontSize: isTerminal ? "12px" : "13px",
    fontWeight: 500 as const,
    letterSpacing: isTerminal ? "1px" : "0.02em",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ position: "fixed", top: "16px", right: "20px", zIndex: 50 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: "100%", maxWidth: isTerminal ? "500px" : "400px" }}>
        {isTerminal ? (
          <div
            style={{
              background: "#1e1e1e",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                background: "#2d2d2d",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28c840" }} />
              </div>
              <span style={{ flex: 1, textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
                locker register — zsh
              </span>
              <div style={{ width: "52px" }} />
            </div>
            <div style={{ padding: "24px", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
              <div style={{ color: "#999", marginBottom: "16px" }}>
                <span style={{ color: "#32d74b" }}>$</span> locker login --register
              </div>
              <div style={{ color: "#cccccc", marginBottom: "16px" }}>Create a new Locker account</div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ color: "#32d74b" }}>Email: </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ background: "transparent", border: "none", color: "#cccccc", fontFamily: "var(--font-mono)", fontSize: "13px", outline: "none", width: "calc(100% - 60px)" }}
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ color: "#32d74b" }}>Password: </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ background: "transparent", border: "none", color: "#cccccc", fontFamily: "var(--font-mono)", fontSize: "13px", outline: "none", width: "calc(100% - 90px)" }}
                  />
                </div>

                {error && (
                  <div style={{ color: "#ff5f57", marginBottom: "12px" }}>Error: {error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: "transparent", border: "1px solid var(--border-accent)", color: "#32d74b", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "6px 16px", borderRadius: "4px", cursor: "pointer", letterSpacing: "1px" }}
                >
                  {loading ? "CREATING ACCOUNT..." : "[ENTER] REGISTER"}
                </button>
              </form>

              <div style={{ marginTop: "16px", color: "#666" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#32d74b", textDecoration: "underline" }}>locker login</Link>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                Create your account
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                Free for up to 3 services
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                padding: "32px",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-card)",
                backdropFilter: "var(--glass-blur)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" style={inputStyle} autoFocus />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Minimum 8 characters" style={inputStyle} />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--error)", fontSize: "13px", marginBottom: "20px" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "12px", borderRadius: "var(--radius-md)", border: "none", background: "#ffffff", color: "#000000", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "24px", color: "var(--text-tertiary)", fontSize: "13px" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
