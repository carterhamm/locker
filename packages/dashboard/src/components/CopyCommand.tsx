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
        padding: "20px 22px",
        borderRadius: "18px",
        border: `1px solid ${isCopied ? "rgba(50, 215, 75, 0.25)" : "rgba(255,255,255,0.06)"}`,
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        /* Glass background — like the reference */
        background: "rgba(28, 28, 28, 0.85)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        /* Inner shadow for depth + drop shadow — like the reference */
        boxShadow: isCopied
          ? `inset -8px 1px 13px rgba(50, 215, 75, 0.15),
             0 16px 28px rgba(0, 0, 0, 0.12),
             0 0 0 1px rgba(50, 215, 75, 0.08)`
          : `inset -4px 1px 10px rgba(255, 255, 255, 0.02),
             0 16px 28px rgba(0, 0, 0, 0.12),
             0 0 0 1px rgba(255, 255, 255, 0.03)`,
        transition: "all 350ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        if (!isCopied) {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `inset -4px 1px 10px rgba(255, 255, 255, 0.03),
            0 20px 40px rgba(0, 0, 0, 0.18),
            0 0 0 1px rgba(255, 255, 255, 0.05)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isCopied) {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = `inset -4px 1px 10px rgba(255, 255, 255, 0.02),
            0 16px 28px rgba(0, 0, 0, 0.12),
            0 0 0 1px rgba(255, 255, 255, 0.03)`;
        }
      }}
    >
      {/* ── Green color shape — bleeds to right edge like the reference.
           Uses a tall rectangle with rounded left side, not a circle.
           Covers the entire right portion of the tile. ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "45%",
          background: isCopied
            ? "linear-gradient(135deg, transparent 0%, rgba(50, 215, 75, 0.12) 40%, rgba(50, 215, 75, 0.22) 100%)"
            : "transparent",
          borderRadius: "80px 0 0 80px",
          pointerEvents: "none",
          transition: isCopied
            ? "background 400ms cubic-bezier(0.16, 1, 0.3, 1)"
            : "background 150ms ease",
        }}
      />
      {/* Bright concentrated glow at top-right corner */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-20px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(50, 215, 75, 0.5) 0%, rgba(50, 215, 75, 0.15) 35%, transparent 65%)",
          filter: "blur(10px)",
          pointerEvents: "none",
          opacity: isCopied ? 1 : 0,
          transform: isCopied ? "scale(1)" : "scale(0.6)",
          transition: isCopied
            ? "opacity 250ms ease 50ms, transform 400ms cubic-bezier(0.16, 1, 0.3, 1) 50ms"
            : "opacity 80ms ease, transform 150ms ease",
        }}
      />

      {/* Subtle top highlight — glass refraction effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(to right, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
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
            transition: "color 250ms ease",
          }}
        >
          {isCopied ? "Copied!" : label}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--text-primary)" }}>
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
          width: "34px",
          height: "34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "10px",
          background: isCopied ? "rgba(50,215,75,0.12)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isCopied ? "rgba(50,215,75,0.25)" : "rgba(255,255,255,0.06)"}`,
          transition: "all 250ms ease",
          /* Subtle inner shadow on the icon container */
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.15)",
        }}
      >
        <AnimatePresence mode="wait">
          {isCopied ? (
            <motion.svg
              key="check"
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#32d74b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="copy"
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.15 }}
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
