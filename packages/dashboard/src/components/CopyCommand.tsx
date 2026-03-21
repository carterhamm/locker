"use client";

import { motion, AnimatePresence } from "framer-motion";

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
    try { await navigator.clipboard.writeText(command); } catch {
      const el = document.createElement("textarea"); el.value = command;
      document.body.appendChild(el); el.select(); document.execCommand("copy");
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
        border: `1px solid ${isCopied ? "rgba(50, 215, 75, 0.2)" : "var(--border-subtle)"}`,
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        background: "rgba(20, 20, 20, 0.7)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        boxShadow: isCopied
          ? "inset -8px 1px 16px rgba(50, 215, 75, 0.1), 0 8px 24px rgba(0,0,0,0.15)"
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
      {/* Green orb — right side only, scales in */}
      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "0px",
          width: "130px",
          height: "130px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(50, 215, 75, 0.45) 0%, rgba(50, 215, 75, 0.12) 40%, transparent 70%)",
          filter: "blur(16px)",
          pointerEvents: "none",
          opacity: isCopied ? 1 : 0,
          transform: isCopied ? "scale(1)" : "scale(0.4)",
          transition: isCopied
            ? "opacity 200ms ease, transform 350ms cubic-bezier(0.16, 1, 0.3, 1)"
            : "opacity 100ms ease, transform 200ms ease",
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
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--text-primary)" }}>
          <span style={{ color: "var(--text-tertiary)", marginRight: "6px" }}>$</span>
          {command}
        </div>
      </div>

      {/* Copy / check icon with animated checkmark */}
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
        <AnimatePresence mode="wait">
          {isCopied ? (
            <motion.svg
              key="check"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#32d74b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="copy"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
