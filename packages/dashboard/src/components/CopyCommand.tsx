"use client";

interface CopyCommandProps {
  command: string;
  label: string;
  id: string;
  copiedId: string | null;
  onCopy: (id: string) => void;
}

export function CopyCommand({ command, label, id, copiedId, onCopy }: CopyCommandProps) {
  const isCopied = copiedId === id;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      const el = document.createElement("textarea");
      el.value = command;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    onCopy(id);
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "18px 22px",
        borderRadius: "16px",
        border: `1px solid ${isCopied ? "rgba(50, 215, 75, 0.35)" : "var(--border-subtle)"}`,
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        background: "rgba(20, 20, 20, 0.7)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        boxShadow: isCopied
          ? "inset -10px 1px 20px rgba(50, 215, 75, 0.18), 0 8px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(50,215,75,0.12)"
          : "0 8px 24px rgba(0,0,0,0.15)",
        transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        if (!isCopied) {
          e.currentTarget.style.borderColor = "var(--border-medium)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isCopied) {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      {/* Green glow — gradient that sweeps from right, fills tile */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to left, rgba(50, 215, 75, 0.18) 0%, rgba(50, 215, 75, 0.06) 50%, transparent 100%)",
          pointerEvents: "none",
          opacity: isCopied ? 1 : 0,
          transform: isCopied ? "translateX(0)" : "translateX(100%)",
          transition: "opacity 200ms ease, transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      {/* Bright accent orb on right edge */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(50, 215, 75, 0.5) 0%, rgba(50, 215, 75, 0.15) 40%, transparent 70%)",
          filter: "blur(15px)",
          pointerEvents: "none",
          opacity: isCopied ? 1 : 0,
          transition: "opacity 300ms ease 100ms",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            color: isCopied ? "rgba(50, 215, 75, 0.6)" : "rgba(255,255,255,0.35)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "6px",
            transition: "color 300ms ease",
          }}
        >
          {isCopied ? "Copied!" : label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--text-primary)",
          }}
        >
          <span style={{ color: "var(--text-tertiary)", marginRight: "6px" }}>$</span>
          {command}
        </div>
      </div>

      {/* Copy / check icon */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
          marginLeft: "16px",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          background: isCopied ? "rgba(50,215,75,0.2)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isCopied ? "rgba(50,215,75,0.4)" : "rgba(255,255,255,0.06)"}`,
          transition: "all 200ms ease",
        }}
      >
        {isCopied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#32d74b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </div>
    </button>
  );
}
