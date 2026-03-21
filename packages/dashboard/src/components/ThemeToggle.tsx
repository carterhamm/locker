"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isTerminal = theme === "terminal";

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={`Switch to ${isTerminal ? "modern" : "terminal"} mode`}
      title={`Switch to ${isTerminal ? "modern" : "terminal"} mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: isTerminal ? "6px 12px" : "8px 16px",
        borderRadius: isTerminal ? "4px" : "100px",
        border: `1px solid ${isTerminal ? "var(--border-accent)" : "var(--border-medium)"}`,
        background: isTerminal ? "var(--bg-tertiary)" : "var(--bg-glass)",
        backdropFilter: isTerminal ? "none" : "blur(12px)",
        color: "var(--text-primary)",
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        fontSize: isTerminal ? "12px" : "13px",
        fontWeight: 500,
        transition: `all var(--duration-normal) var(--ease-out-expo)`,
        letterSpacing: isTerminal ? "0.5px" : "0.02em",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = `0 0 20px var(--accent-glow)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isTerminal
          ? "var(--border-accent)"
          : "var(--border-medium)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {isTerminal ? (
        <>
          <span style={{ fontSize: "14px" }}>{">"}_</span>
          <span>TERMINAL</span>
          <span
            style={{
              display: "inline-block",
              width: "28px",
              height: "16px",
              borderRadius: "4px",
              background: "var(--accent)",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                right: "2px",
                top: "2px",
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: "var(--bg-primary)",
                transition: `all var(--duration-fast) var(--ease-out-expo)`,
              }}
            />
          </span>
        </>
      ) : (
        <>
          <span
            style={{
              display: "inline-block",
              width: "28px",
              height: "16px",
              borderRadius: "100px",
              background: "var(--border-medium)",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "2px",
                top: "2px",
                width: "12px",
                height: "12px",
                borderRadius: "100px",
                background: "var(--text-primary)",
                transition: `all var(--duration-fast) var(--ease-out-expo)`,
              }}
            />
          </span>
          <span>Modern</span>
        </>
      )}
    </button>
  );
}
