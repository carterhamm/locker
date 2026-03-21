"use client";

import { useAuth } from "@/components/AuthProvider";
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

/* ── Consistent layout constant ── */
const PAGE_PADDING = 40;
const MAX_WIDTH = 1200;

/* ─── Feature Card ─── */
function FeatureCard({
  title,
  description,
  icon,
  delay,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className="animate-in"
      style={{
        animationDelay: `${delay}ms`,
        padding: "32px",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-card)",
        backdropFilter: "var(--glass-blur)",
        transition: `all var(--duration-normal) var(--ease-out-expo)`,
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-card-hover)";
        e.currentTarget.style.borderColor = "var(--border-medium)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--bg-card)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          marginBottom: "16px",
          width: "44px",
          height: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-md)",
          background: "var(--accent-glow)",
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
          lineHeight: "1.6",
        }}
      >
        {description}
      </p>
    </div>
  );
}

/* ── Code Block ── */
function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-tertiary)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-subtle)",
        padding: "28px 32px",
        fontFamily: "var(--font-mono)",
        fontSize: "14px",
        lineHeight: "1.8",
        color: "var(--text-primary)",
        boxShadow: "var(--shadow-card)",
        overflow: "auto",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── Nav — transparent, no bg ── */}
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
        {/* Logo */}
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

        {/* Right side — GitHub + Sign In, right-aligned to consistent edge */}
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
          {user ? (
            <Link
              href="/dashboard"
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
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth"
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
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          paddingTop: "160px",
          paddingBottom: "120px",
          paddingLeft: `${PAGE_PADDING}px`,
          paddingRight: `${PAGE_PADDING}px`,
          maxWidth: `${MAX_WIDTH + PAGE_PADDING * 2}px`,
          margin: "0 auto",
          position: "relative",
          textAlign: "center",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
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
              href="#how-it-works"
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
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        style={{
          padding: `80px ${PAGE_PADDING}px`,
          maxWidth: `${900 + PAGE_PADDING * 2}px`,
          margin: "0 auto",
        }}
      >
        <h2
          className="animate-in"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: "56px",
          }}
        >
          Three commands. That&apos;s it.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <CodeBlock>
            <div>
              <span style={{ color: "#666" }}># </span>
              <span style={{ color: "var(--text-secondary)" }}>Install once</span>
            </div>
            <div>$ npm install -g locker-cli</div>
          </CodeBlock>

          <CodeBlock>
            <div>
              <span style={{ color: "#666" }}># </span>
              <span style={{ color: "var(--text-secondary)" }}>Login once</span>
            </div>
            <div>$ locker login</div>
            <div style={{ color: "var(--text-tertiary)" }}>
              Logged in as you@company.com
            </div>
          </CodeBlock>

          <CodeBlock>
            <div>
              <span style={{ color: "#666" }}># </span>
              <span style={{ color: "var(--text-secondary)" }}>
                Any agent retrieves keys instantly
              </span>
            </div>
            <div>$ locker get openai</div>
            <div style={{ color: "var(--text-accent)" }}>sk-proj-abc123...</div>
          </CodeBlock>
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
        <h2
          className="animate-in"
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
          />
          <FeatureCard
            icon={<AuditLogIcon size={22} />}
            title="Full Audit Trail"
            description="Every retrieval logged with timestamp, user, and agent identifier. Know exactly who accessed what."
            delay={80}
          />
          <FeatureCard
            icon={<TerminalIcon size={22} />}
            title="CLI-First"
            description="Built for developers. locker get <service> returns your key to stdout. Works with Claude, Cursor, Codex."
            delay={160}
          />
          <FeatureCard
            icon={<BoltIcon size={22} />}
            title="Instant Retrieval"
            description="Sub-100ms key retrieval. Your AI agent doesn't wait. Neither do you."
            delay={240}
          />
          <FeatureCard
            icon={<KeyScopeIcon size={22} />}
            title="Scoped Access"
            description="JWT-authenticated. Short-lived tokens. Each user's keys are isolated. No cross-user access."
            delay={320}
          />
          <FeatureCard
            icon={<GlobePlugIcon size={22} />}
            title="Works With Everything"
            description="Resend, Stripe, OpenAI, GitHub — any service that issues API keys. No integrations needed."
            delay={400}
          />
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: `80px ${PAGE_PADDING}px 120px`,
          maxWidth: "800px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          className="animate-in"
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
          className="animate-in stagger-2"
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
          className="animate-in stagger-3"
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
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: `32px ${PAGE_PADDING}px`,
          borderTop: "1px solid var(--border-subtle)",
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
          fontSize: "13px",
        }}
      >
        &copy; 2026 Nexus AI. All rights reserved.
      </footer>
    </div>
  );
}
