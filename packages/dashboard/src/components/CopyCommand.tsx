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
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        background: "rgba(28, 28, 28, 0.85)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        boxShadow: isCopied
          ? `inset 0 0 30px rgba(50, 215, 75, 0.06),
             inset -20px 0 40px rgba(50, 215, 75, 0.15),
             inset -40px 0 60px rgba(50, 215, 75, 0.06),
             0 12px 24px rgba(0, 0, 0, 0.1)`
          : `inset -4px 1px 10px rgba(255, 255, 255, 0.02),
             0 12px 24px rgba(0, 0, 0, 0.1)`,
        transition: "all 350ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        if (!isCopied) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `inset -4px 1px 10px rgba(255, 255, 255, 0.03),
            0 20px 40px rgba(0, 0, 0, 0.15)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isCopied) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = `inset -4px 1px 10px rgba(255, 255, 255, 0.02),
            0 12px 24px rgba(0, 0, 0, 0.1)`;
        }
      }}
    >
      {/* Fading border — visible at top-left & bottom-right, invisible at top-right & bottom-left */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "18px",
          padding: "1px",
          background: isCopied
            ? "linear-gradient(135deg, rgba(50,215,75,0.3) 0%, rgba(50,215,75,0.06) 40%, rgba(50,215,75,0.06) 60%, rgba(50,215,75,0.3) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.1) 100%)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
          zIndex: 2,
          transition: "background 300ms ease",
        }}
      />
        {/* Soft green ambient glow — very subtle, right side */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-30px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(50, 215, 75, 0.2) 0%, transparent 60%)",
            filter: "blur(30px)",
            pointerEvents: "none",
            opacity: isCopied ? 1 : 0,
            transition: isCopied ? "opacity 300ms ease" : "opacity 120ms ease",
          }}
        />

        {/* Top highlight */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, height: "1px",
            background: "linear-gradient(to right, transparent 10%, rgba(255,255,255,0.05) 50%, transparent 90%)",
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Animated label swap */}
          <div style={{ height: "16px", marginBottom: "6px", overflow: "hidden", position: "relative" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={isCopied ? "copied" : "label"}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  color: isCopied ? "rgba(50, 215, 75, 0.7)" : "rgba(255,255,255,0.35)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {isCopied ? "Copied!" : label}
              </motion.div>
            </AnimatePresence>
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
            background: isCopied ? "rgba(50,215,75,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isCopied ? "rgba(50,215,75,0.2)" : "rgba(255,255,255,0.06)"}`,
            transition: "all 250ms ease",
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
