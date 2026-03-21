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
        border: "1px solid rgba(50, 215, 75, 0.12)",
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        /* Glass background */
        background: "rgba(20, 20, 20, 0.7)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        /* Inner shadow for depth — green tint like the screenshot */
        boxShadow: `
          inset -8px 1px 13px rgba(50, 215, 75, 0.08),
          0 16px 28px rgba(0, 0, 0, 0.15),
          0 0 0 1px rgba(50, 215, 75, 0.06)
        `,
        transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(50, 215, 75, 0.25)";
        e.currentTarget.style.boxShadow = `
          inset -8px 1px 16px rgba(50, 215, 75, 0.12),
          0 16px 28px rgba(0, 0, 0, 0.2),
          0 0 0 1px rgba(50, 215, 75, 0.1),
          0 0 40px rgba(50, 215, 75, 0.06)
        `;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(50, 215, 75, 0.12)";
        e.currentTarget.style.boxShadow = `
          inset -8px 1px 13px rgba(50, 215, 75, 0.08),
          0 16px 28px rgba(0, 0, 0, 0.15),
          0 0 0 1px rgba(50, 215, 75, 0.06)
        `;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Green glow orb — top right, like the orange blob in the screenshot */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-20px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(50, 215, 75, 0.2) 0%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            color: "var(--text-primary)",
          }}
        >
          <span style={{ color: "rgba(50, 215, 75, 0.5)", marginRight: "6px" }}>$</span>
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
          background: isCopied ? "rgba(50,215,75,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isCopied ? "rgba(50,215,75,0.3)" : "rgba(255,255,255,0.06)"}`,
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
