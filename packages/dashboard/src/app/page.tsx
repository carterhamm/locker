"use client";

import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

/* ─── Terminal Window Chrome ─── */
function TerminalWindow({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: "#1e1e1e",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Title bar */}
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
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#ff5f57",
            }}
          />
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#febc2e",
            }}
          />
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#28c840",
            }}
          />
        </div>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(255,255,255,0.4)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {title}
        </span>
        <div style={{ width: "52px" }} />
      </div>
      {/* Content */}
      <div
        style={{
          padding: "20px",
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          lineHeight: "1.6",
          color: "#cccccc",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Modern Code Block ─── */
function CodeBlock({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  if (theme === "terminal") {
    return (
      <TerminalWindow title="locker — zsh">
        {children}
      </TerminalWindow>
    );
  }
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

/* ─── Feature Card ─── */
function FeatureCard({
  title,
  description,
  icon,
  delay,
}: {
  title: string;
  description: string;
  icon: string;
  delay: number;
}) {
  const { theme } = useTheme();

  if (theme === "terminal") {
    return (
      <div
        className="animate-in"
        style={{
          animationDelay: `${delay}ms`,
          padding: "16px 20px",
          borderLeft: "2px solid var(--accent)",
          background: "var(--bg-card)",
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
        }}
      >
        <div style={{ color: "var(--text-accent)", marginBottom: "4px" }}>
          [{icon}] {title}
        </div>
        <div style={{ color: "var(--text-secondary)" }}>{description}</div>
      </div>
    );
  }

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
          fontSize: "28px",
          marginBottom: "16px",
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-md)",
          background: "var(--accent-glow)",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 600,
          marginBottom: "8px",
          color: "var(--text-primary)",
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

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isTerminal = theme === "terminal";

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── Nav ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: isTerminal ? "8px 24px" : "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isTerminal
            ? "var(--bg-secondary)"
            : "rgba(0, 0, 0, 0.6)",
          backdropFilter: isTerminal ? "none" : "blur(20px)",
          borderBottom: `1px solid ${isTerminal ? "var(--border-subtle)" : "rgba(255,255,255,0.04)"}`,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: isTerminal ? "14px" : "18px",
            fontWeight: 700,
            letterSpacing: isTerminal ? "2px" : "-0.02em",
            color: "var(--text-accent)",
          }}
        >
          {isTerminal ? "$ locker" : "Locker"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              style={{
                padding: isTerminal ? "6px 14px" : "8px 20px",
                borderRadius: isTerminal ? "4px" : "100px",
                background: "var(--accent)",
                color: "var(--bg-primary)",
                fontFamily: "var(--font-body)",
                fontSize: isTerminal ? "12px" : "13px",
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: isTerminal ? "1px" : "0.02em",
              }}
            >
              {isTerminal ? "DASHBOARD" : "Dashboard"}
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                padding: isTerminal ? "6px 14px" : "8px 20px",
                borderRadius: isTerminal ? "4px" : "100px",
                background: "var(--accent)",
                color: "var(--bg-primary)",
                fontFamily: "var(--font-body)",
                fontSize: isTerminal ? "12px" : "13px",
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: isTerminal ? "1px" : "0.02em",
              }}
            >
              {isTerminal ? "LOGIN" : "Sign In"}
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          paddingTop: isTerminal ? "100px" : "160px",
          paddingBottom: isTerminal ? "60px" : "120px",
          paddingLeft: isTerminal ? "24px" : "40px",
          paddingRight: isTerminal ? "24px" : "40px",
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* Ambient glow — modern only */}
        {!isTerminal && (
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
        )}

        {isTerminal ? (
          /* ── Terminal Hero ── */
          <TerminalWindow title="locker — zsh">
            <div style={{ marginBottom: "16px" }}>
              <span style={{ color: "#32d74b" }}>$</span> cat /etc/locker/about
            </div>
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                LOCKER
              </div>
              <div style={{ color: "#999" }}>
                Secure API credential manager for AI agents.
              </div>
              <div style={{ color: "#999" }}>
                One login. Every key. Any agent.
              </div>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: "#32d74b" }}>$</span> npm install -g
              locker-cli
            </div>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: "#32d74b" }}>$</span> locker login
            </div>
            <div style={{ color: "#666" }}>
              Logged in as you@example.com
            </div>
            <div style={{ marginTop: "8px" }}>
              <span style={{ color: "#32d74b" }}>$</span> locker get openai
            </div>
            <div>
              <span style={{ color: "#32d74b" }}>sk-proj-...</span>
              <span className="terminal-cursor" />
            </div>
          </TerminalWindow>
        ) : (
          /* ── Modern Hero ── */
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
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
              1Password for
              <br />
              AI Agents
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
              Store, retrieve, and manage API keys securely.
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
                href="/register"
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
        )}
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        style={{
          padding: isTerminal ? "40px 24px" : "80px 40px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {isTerminal ? (
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "var(--text-accent)" }}>## </span>
            <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
              HOW IT WORKS
            </span>
          </div>
        ) : (
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
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isTerminal ? "4px" : "20px",
          }}
        >
          <CodeBlock>
            <div>
              <span style={{ color: isTerminal ? "#32d74b" : "#666" }}>
                {isTerminal ? "$ " : "# "}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                Install once
              </span>
            </div>
            <div>
              <span style={{ color: isTerminal ? "#32d74b" : "var(--text-primary)" }}>
                $ npm install -g locker-cli
              </span>
            </div>
          </CodeBlock>

          <CodeBlock>
            <div>
              <span style={{ color: isTerminal ? "#32d74b" : "#666" }}>
                {isTerminal ? "$ " : "# "}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                Login once
              </span>
            </div>
            <div>
              <span style={{ color: isTerminal ? "#32d74b" : "var(--text-primary)" }}>
                $ locker login
              </span>
            </div>
            <div style={{ color: "var(--text-tertiary)" }}>
              Logged in as you@company.com
            </div>
          </CodeBlock>

          <CodeBlock>
            <div>
              <span style={{ color: isTerminal ? "#32d74b" : "#666" }}>
                {isTerminal ? "$ " : "# "}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                Any agent retrieves keys instantly
              </span>
            </div>
            <div>
              <span style={{ color: isTerminal ? "#32d74b" : "var(--text-primary)" }}>
                $ locker get openai
              </span>
            </div>
            <div style={{ color: isTerminal ? "#32d74b" : "var(--text-accent)" }}>
              sk-proj-abc123...
            </div>
          </CodeBlock>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section
        style={{
          padding: isTerminal ? "40px 24px" : "80px 40px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {isTerminal ? (
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "var(--text-accent)" }}>## </span>
            <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
              FEATURES
            </span>
          </div>
        ) : (
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
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isTerminal
              ? "1fr"
              : "repeat(auto-fit, minmax(300px, 1fr))",
            gap: isTerminal ? "8px" : "16px",
          }}
        >
          <FeatureCard
            icon={isTerminal ? "ENCRYPT" : "\u{1F510}"}
            title="AES-256-GCM Encryption"
            description="Every key encrypted with authenticated encryption. Envelope model — your keys are never stored in plaintext."
            delay={0}
          />
          <FeatureCard
            icon={isTerminal ? "AUDIT" : "\u{1F4CB}"}
            title="Full Audit Trail"
            description="Every retrieval logged with timestamp, user, and agent identifier. Know exactly who accessed what."
            delay={80}
          />
          <FeatureCard
            icon={isTerminal ? "CLI" : "\u{2318}"}
            title="CLI-First"
            description="Built for developers. locker get <service> returns your key to stdout. Works with Claude, Cursor, Codex."
            delay={160}
          />
          <FeatureCard
            icon={isTerminal ? "SPEED" : "\u{26A1}"}
            title="Instant Retrieval"
            description="Sub-100ms key retrieval. Your AI agent doesn't wait. Neither do you."
            delay={240}
          />
          <FeatureCard
            icon={isTerminal ? "SCOPE" : "\u{1F512}"}
            title="Scoped Access"
            description="JWT-authenticated. Short-lived tokens. Each user's keys are isolated. No cross-user access."
            delay={320}
          />
          <FeatureCard
            icon={isTerminal ? "WORKS" : "\u{1F30D}"}
            title="Works With Everything"
            description="Resend, Stripe, OpenAI, GitHub — any service that issues API keys. No integrations needed."
            delay={400}
          />
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: isTerminal ? "40px 24px 60px" : "80px 40px 120px",
          maxWidth: "800px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {isTerminal ? (
          <TerminalWindow title="locker — get started">
            <div>
              <span style={{ color: "#32d74b" }}>$</span> echo &quot;Ready to
              secure your keys?&quot;
            </div>
            <div style={{ margin: "12px 0" }}>Ready to secure your keys?</div>
            <div>
              <span style={{ color: "#32d74b" }}>$</span>{" "}
              <Link
                href="/register"
                style={{
                  color: "#32d74b",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                open https://locker.dev/register
              </Link>
            </div>
          </TerminalWindow>
        ) : (
          <>
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
              href="/register"
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
          </>
        )}
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: isTerminal ? "16px 24px" : "32px 40px",
          borderTop: "1px solid var(--border-subtle)",
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
          fontSize: isTerminal ? "11px" : "13px",
        }}
      >
        {isTerminal
          ? "# locker v0.1.0 | nexus-ai.com | 2026"
          : "\u00A9 2026 Nexus AI. All rights reserved."}
      </footer>
    </div>
  );
}
