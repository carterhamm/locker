"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ScrollReveal } from "@/components/ScrollReveal";
import { TerminalDemo } from "@/components/TerminalDemo";
import { CopyCommand } from "@/components/CopyCommand";
import {
  ShieldLockIcon,
  AuditLogIcon,
  TerminalIcon,
  BoltIcon,
  KeyScopeIcon,
  GlobePlugIcon,
  GitHubIcon,
  LockerLogo,
} from "@/components/Icons";
import Link from "next/link";

const PAGE_PADDING = 40;
const MAX_WIDTH = 1200;

/* ─── Feature Card with visual weight ─── */
function FeatureCard({
  title,
  description,
  icon,
  delay,
  glowColor = "rgba(255,255,255,0.06)",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
  glowColor?: string;
}) {
  return (
    <ScrollReveal delay={delay}>
      <div
        style={{
          padding: "32px",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          backdropFilter: "var(--glass-blur)",
          transition: `all var(--duration-normal) var(--ease-out-expo)`,
          cursor: "default",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-card-hover)";
          e.currentTarget.style.borderColor = "var(--border-medium)";
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = `0 0 0 1px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.4), 0 0 80px ${glowColor}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--bg-card)";
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Ambient glow behind icon */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            marginBottom: "20px",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-md)",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-primary)",
          }}
        >
          {icon}
        </div>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "17px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "14px",
            lineHeight: "1.65",
          }}
        >
          {description}
        </p>
      </div>
    </ScrollReveal>
  );
}

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback((id: string) => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopiedId(id);
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* ── Mesh gradient background atmosphere ── */}
      <div className="mesh-gradient">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>

      {/* ── Nav — transparent ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: `16px ${PAGE_PADDING}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: `${MAX_WIDTH + PAGE_PADDING * 2}px`,
          margin: "0 auto",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <LockerLogo size={26} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Locker
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              border: "1px solid var(--border-medium)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
              transition: `all var(--duration-normal) var(--ease-out-expo)`,
            }}
          >
            <GitHubIcon size={16} />
            GitHub
          </a>
          <Link
            href={user ? "/dashboard" : "/auth"}
            style={{
              padding: "8px 20px",
              borderRadius: "100px",
              background: "#ffffff",
              color: "#000000",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              transition: `all var(--duration-normal) var(--ease-out-expo)`,
            }}
          >
            {user ? "Dashboard" : "Sign In"}
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          paddingTop: "160px",
          paddingBottom: "100px",
          paddingLeft: `${PAGE_PADDING}px`,
          paddingRight: `${PAGE_PADDING}px`,
          maxWidth: `${MAX_WIDTH + PAGE_PADDING * 2}px`,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div className="animate-in stagger-1">
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: "24px",
            }}
          >
            Secure credential management
          </p>
        </div>

        <h1
          className="animate-in stagger-2"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: "24px",
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Your keys,
          <br />
          locked down
        </h1>

        <p
          className="animate-in stagger-3"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "18px",
            color: "var(--text-secondary)",
            maxWidth: "520px",
            margin: "0 auto 48px",
            lineHeight: "1.7",
          }}
        >
          The secure vault for API credentials.
          <br />
          One login. Every key available to any agent.
        </p>

        <div
          className="animate-in stagger-4"
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/auth"
            style={{
              padding: "14px 36px",
              borderRadius: "100px",
              background: "#ffffff",
              color: "#000000",
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              transition: `all var(--duration-normal) var(--ease-out-expo)`,
              boxShadow: "0 0 40px rgba(255,255,255,0.1)",
            }}
          >
            Get Started Free
          </Link>
          <a
            href="#demo"
            style={{
              padding: "14px 36px",
              borderRadius: "100px",
              border: "1px solid var(--border-medium)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              fontWeight: 500,
              textDecoration: "none",
              transition: `all var(--duration-normal) var(--ease-out-expo)`,
            }}
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* ── Interactive Terminal Demo ── */}
      <section
        id="demo"
        style={{
          padding: `60px ${PAGE_PADDING}px 80px`,
          maxWidth: `${800 + PAGE_PADDING * 2}px`,
          margin: "0 auto",
        }}
      >
        <ScrollReveal style={{ overflow: "visible" }}>
          <TerminalDemo />
        </ScrollReveal>

        {/* Tap-to-copy commands */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
          <ScrollReveal delay={100}>
            <CopyCommand command="npm install -g locker-cli" label="Install" id="install" copiedId={copiedId} onCopy={handleCopy} />
          </ScrollReveal>
          <ScrollReveal delay={180}>
            <CopyCommand command="locker login" label="Authenticate" id="login" copiedId={copiedId} onCopy={handleCopy} />
          </ScrollReveal>
          <ScrollReveal delay={260}>
            <CopyCommand command="locker get openai" label="Retrieve a key" id="get" copiedId={copiedId} onCopy={handleCopy} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section
        style={{
          padding: `80px ${PAGE_PADDING}px`,
          maxWidth: `${MAX_WIDTH + PAGE_PADDING * 2}px`,
          margin: "0 auto",
        }}
      >
        <ScrollReveal>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              textAlign: "center",
              marginBottom: "56px",
            }}
          >
            Built for security-first developers
          </h2>
        </ScrollReveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          <FeatureCard
            icon={<ShieldLockIcon size={22} />}
            title="AES-256-GCM Encryption"
            description="Every key encrypted with authenticated encryption. Envelope model — your keys are never stored in plaintext."
            delay={0}
            glowColor="rgba(255,255,255,0.08)"
          />
          <FeatureCard
            icon={<AuditLogIcon size={22} />}
            title="Full Audit Trail"
            description="Every retrieval logged with timestamp, user, and agent identifier. Know exactly who accessed what."
            delay={80}
            glowColor="rgba(120,180,255,0.06)"
          />
          <FeatureCard
            icon={<TerminalIcon size={22} />}
            title="CLI-First"
            description="Built for developers. locker get <service> returns your key to stdout. Works with Claude, Cursor, Codex."
            delay={160}
            glowColor="rgba(50,215,75,0.06)"
          />
          <FeatureCard
            icon={<BoltIcon size={22} />}
            title="Instant Retrieval"
            description="Sub-100ms key retrieval. Your AI agent doesn't wait. Neither do you."
            delay={240}
            glowColor="rgba(255,200,50,0.06)"
          />
          <FeatureCard
            icon={<KeyScopeIcon size={22} />}
            title="Scoped Access"
            description="JWT-authenticated. Short-lived tokens. Each user's keys are isolated. No cross-user access."
            delay={320}
            glowColor="rgba(200,120,255,0.06)"
          />
          <FeatureCard
            icon={<GlobePlugIcon size={22} />}
            title="Works With Everything"
            description="Resend, Stripe, OpenAI, GitHub — any service that issues API keys. No integrations needed."
            delay={400}
            glowColor="rgba(100,210,255,0.06)"
          />
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: `80px ${PAGE_PADDING}px 100px`,
          maxWidth: "800px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <ScrollReveal>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "20px",
            }}
          >
            Stop copy-pasting API keys
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "17px",
              marginBottom: "40px",
              lineHeight: "1.7",
            }}
          >
            Free for up to 3 services. Pro starts at $9/month.
          </p>
          <Link
            href="/auth"
            style={{
              display: "inline-block",
              padding: "16px 48px",
              borderRadius: "100px",
              background: "#ffffff",
              color: "#000000",
              fontFamily: "var(--font-body)",
              fontSize: "16px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 0 60px rgba(255,255,255,0.1)",
              transition: `all var(--duration-normal) var(--ease-out-expo)`,
            }}
          >
            Create Free Account
          </Link>
        </ScrollReveal>
      </section>

      {/* ── Footer with substance ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: `48px ${PAGE_PADDING}px 40px`,
          maxWidth: `${MAX_WIDTH + PAGE_PADDING * 2}px`,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "40px",
            marginBottom: "48px",
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <LockerLogo size={20} />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                Locker
              </span>
            </div>
            <p
              style={{
                color: "var(--text-tertiary)",
                fontSize: "13px",
                lineHeight: "1.6",
                maxWidth: "220px",
              }}
            >
              Secure API credential manager for AI agents and developers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "16px",
              }}
            >
              Product
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link href="/auth" style={{ color: "var(--text-tertiary)", fontSize: "13px", textDecoration: "none", transition: "color 150ms" }}>
                Sign Up
              </Link>
              <Link href="/dashboard" style={{ color: "var(--text-tertiary)", fontSize: "13px", textDecoration: "none" }}>
                Dashboard
              </Link>
              <span style={{ color: "var(--text-tertiary)", fontSize: "13px", opacity: 0.5 }}>
                Pricing (soon)
              </span>
              <span style={{ color: "var(--text-tertiary)", fontSize: "13px", opacity: 0.5 }}>
                Documentation (soon)
              </span>
            </div>
          </div>

          {/* Developers */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "16px",
              }}
            >
              Developers
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="https://github.com/carterhamm" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-tertiary)", fontSize: "13px", textDecoration: "none" }}>
                GitHub
              </a>
              <span style={{ color: "var(--text-tertiary)", fontSize: "13px", opacity: 0.5 }}>
                API Reference (soon)
              </span>
              <span style={{ color: "var(--text-tertiary)", fontSize: "13px", opacity: 0.5 }}>
                CLI Docs (soon)
              </span>
              <span style={{ color: "var(--text-tertiary)", fontSize: "13px", opacity: 0.5 }}>
                MCP Server (soon)
              </span>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "16px",
              }}
            >
              Company
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>
                Nexus AI
              </span>
              <span style={{ color: "var(--text-tertiary)", fontSize: "13px", opacity: 0.5 }}>
                Security (soon)
              </span>
              <span style={{ color: "var(--text-tertiary)", fontSize: "13px", opacity: 0.5 }}>
                Status (soon)
              </span>
              <span style={{ color: "var(--text-tertiary)", fontSize: "13px", opacity: 0.5 }}>
                Changelog (soon)
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "24px",
            borderTop: "1px solid var(--border-subtle)",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
            &copy; 2026 Nexus AI. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: "20px" }}>
            <span style={{ color: "var(--text-tertiary)", fontSize: "12px", opacity: 0.5 }}>
              Privacy
            </span>
            <span style={{ color: "var(--text-tertiary)", fontSize: "12px", opacity: 0.5 }}>
              Terms
            </span>
            <a
              href="https://github.com/carterhamm"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-tertiary)", fontSize: "12px", textDecoration: "none" }}
            >
              <GitHubIcon size={14} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
