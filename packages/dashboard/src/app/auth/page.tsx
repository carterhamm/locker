"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LockerLogo, CloseIcon, PasskeyIcon } from "@/components/Icons";
import { FadingBorder } from "@/components/FadingBorder";
import Link from "next/link";

/* ── Test account credentials (works without backend) ── */
const TEST_EMAIL = "a@b.c";
const TEST_PASSWORD = "thankyou";
const TEST_USER = { id: "demo-001", email: TEST_EMAIL };
const TEST_TOKEN = "eyJkZW1vIjp0cnVlfQ.demo-token";

type Step = "email" | "password" | "register";

export default function AuthPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeysAvailable, setPasskeysAvailable] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Check if WebAuthn is available
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.PublicKeyCredential &&
      PublicKeyCredential.isConditionalMediationAvailable
    ) {
      PublicKeyCredential.isConditionalMediationAvailable().then((available) => {
        setPasskeysAvailable(available);
      });
    }
  }, []);

  // Esc key to go back
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (step === "email") {
          router.push("/");
        } else {
          setStep("email");
          setPassword("");
          setError("");
        }
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [step, router]);

  // Focus password/name field when step changes
  useEffect(() => {
    if (step === "password") {
      setTimeout(() => passwordRef.current?.focus(), 350);
    } else if (step === "register") {
      setTimeout(() => nameRef.current?.focus(), 350);
    }
  }, [step]);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    setLoading(true);

    try {
      // Test account shortcut
      if (email.toLowerCase() === TEST_EMAIL) {
        setStep("password");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        // API might not be running — for demo, assume new account
        setStep("register");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setStep(data.exists ? "password" : "register");
    } catch {
      // Network error — assume new account for demo
      setStep("register");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!password) return;
    setLoading(true);

    try {
      // Test account shortcut
      if (email.toLowerCase() === TEST_EMAIL) {
        if (password === TEST_PASSWORD) {
          login(TEST_TOKEN, TEST_USER);
          router.push("/dashboard");
          return;
        } else {
          setError("Invalid password");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid password");
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

  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!password) return;

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

  async function handlePasskeyAuth() {
    setError("");
    try {
      // For passkey, we'd normally call navigator.credentials.get()
      // with a challenge from the server. For now, show that it's wired up.
      if (!window.PublicKeyCredential) {
        setError("Passkeys not supported in this browser");
        return;
      }

      // This would be replaced with a real server challenge
      setError("Passkey authentication requires a registered passkey. Use password for now.");
    } catch {
      setError("Passkey authentication failed");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-medium)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 150ms ease",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
      }}
    >
      {/* Background atmosphere */}
      <div className="mesh-gradient">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>
      {/* ── Close button (X) top-left ── */}
      <button
        onClick={() => (step === "email" ? router.push("/") : (setStep("email"), setPassword(""), setError("")))}
        style={{
          position: "fixed",
          top: "16px",
          left: "20px",
          zIndex: 50,
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: "none",
          background: "var(--bg-glass)",
          backdropFilter: "blur(12px)",
          color: "var(--text-secondary)",
          cursor: "pointer",
          transition: "all 150ms ease",
          overflow: "hidden",
        }}
        aria-label="Go back"
      >
        <FadingBorder radius="50%" />
        <CloseIcon size={16} />
      </button>

      {/* ── GitHub link — right side, aligned to same edge as landing nav ── */}
      <div
        style={{
          position: "fixed",
          top: "16px",
          right: "40px",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <a
          href="https://github.com/carterhamm"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 16px",
            borderRadius: "100px",
            border: "none",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <FadingBorder radius="100px" />
          <span style={{ display: "flex", alignItems: "center", color: "var(--text-secondary)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 17.07 3.633 16.7 3.633 16.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </span>
          GitHub
        </a>
      </div>

      {/* ── Auth Card ── */}
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Large logo above card */}
        <div
          className="animate-in stagger-1"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
          }}
        >
          <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none", gap: "12px" }}>
            <LockerLogo size={72} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              Locker
            </span>
          </Link>
        </div>

        {/* Expanding card */}
        <div
          className="animate-in stagger-2"
          style={{
            padding: "36px",
            borderRadius: "var(--radius-xl)",
            border: "none",
            background: "var(--bg-card)",
            backdropFilter: "var(--glass-blur)",
            boxShadow: "var(--shadow-card)",
            transition: `all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <FadingBorder radius="var(--radius-xl)" />
          {/* Title — changes based on step */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: "6px",
                transition: "all 200ms ease",
              }}
            >
              {step === "email" && "Welcome back!"}
              {step === "password" && "Welcome back!"}
              {step === "register" && "Create your account"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              {step === "email" && "Enter your email to continue"}
              {step === "password" && email}
              {step === "register" && "Free for up to 3 services"}
            </p>
          </div>

          {/* ── Step: Email ── */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  style={inputStyle}
                  autoFocus
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-medium)")}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "#ffffff",
                  color: "#000000",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 150ms ease",
                }}
              >
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>
          )}

          {/* ── Step: Password (existing account) ── */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <input
                  ref={passwordRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-medium)")}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "var(--error)",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "#ffffff",
                  color: "#000000",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 150ms ease",
                  marginBottom: passkeysAvailable ? "12px" : "0",
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {/* Passkey option */}
              {passkeysAvailable && (
                <button
                  type="button"
                  onClick={handlePasskeyAuth}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-medium)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 150ms ease",
                  }}
                >
                  <PasskeyIcon size={16} />
                  Sign in with Passkey
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setError("");
                }}
                style={{
                  display: "block",
                  margin: "16px auto 0",
                  background: "none",
                  border: "none",
                  color: "var(--text-tertiary)",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                Use a different email
              </button>
            </form>
          )}

          {/* ── Step: Register (new account) ── */}
          {step === "register" && (
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-medium)")}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password (min 8 chars)"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--border-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-medium)")}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "var(--error)",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "#ffffff",
                  color: "#000000",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "all 150ms ease",
                }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setName("");
                  setError("");
                }}
                style={{
                  display: "block",
                  margin: "16px auto 0",
                  background: "none",
                  border: "none",
                  color: "var(--text-tertiary)",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
