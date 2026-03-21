"use client";

import { useEffect, useRef, useReducer, useState, useCallback } from "react";
import { LockerLogo } from "./Icons";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "comment" | "success";
  delay: number;
  /** The actual command (without $) — for tap-to-copy */
  copyText?: string;
}

const LINES: TerminalLine[] = [
  { text: "# Install the CLI", type: "comment", delay: 500 },
  { text: "$ npm install -g locker-cli", type: "command", delay: 200, copyText: "npm install -g locker-cli" },
  { text: "added 42 packages in 2.1s", type: "output", delay: 1200 },
  { text: "", type: "output", delay: 400 },
  { text: "# Login once — that's it", type: "comment", delay: 400 },
  { text: "$ locker login", type: "command", delay: 200, copyText: "locker login" },
  { text: "Email: george@harrison.com", type: "output", delay: 900 },
  { text: "✓ Logged in as george@harrison.com", type: "success", delay: 700 },
  { text: "", type: "output", delay: 400 },
  { text: "# Any agent retrieves keys instantly", type: "comment", delay: 400 },
  { text: "$ locker get openai", type: "command", delay: 200, copyText: "locker get openai" },
  { text: "sk-proj-aBcDeFgHiJkLmNoPqRsT...", type: "success", delay: 600 },
  { text: "", type: "output", delay: 500 },
  { text: "$ locker get resend", type: "command", delay: 200, copyText: "locker get resend" },
  { text: "re_aBcDeFgHiJkLmNoPqRsT...", type: "success", delay: 600 },
  { text: "", type: "output", delay: 400 },
];

const COLORS: Record<string, string> = {
  command: "#e2e2e2",
  output: "rgba(255,255,255,0.4)",
  comment: "rgba(255,255,255,0.25)",
  success: "#32d74b",
};

const LINE_HEIGHT = 23; // px — consistent for all lines including empty
const TOTAL_LINES = LINES.length + 1; // +1 for the final $ prompt
const BODY_PADDING = 20;
const BODY_HEIGHT = TOTAL_LINES * LINE_HEIGHT + BODY_PADDING * 2;

export function TerminalDemo() {
  const [, forceRender] = useReducer((x: number) => x + 1, 0);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);

  const completedLines = useRef<TerminalLine[]>([]);
  const typingText = useRef("");
  const isDone = useRef(false);
  const isRunning = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isRunning.current && !isDone.current) {
          isRunning.current = true;
          observer.disconnect();
          runAnimation();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function render() {
    forceRender();
  }

  async function runAnimation() {
    for (let i = 0; i < LINES.length; i++) {
      const line = LINES[i];
      if (line.type === "command") {
        typingText.current = "";
        render();
        for (let c = 0; c < line.text.length; c++) {
          await wait(45 + Math.random() * 40);
          typingText.current = line.text.slice(0, c + 1);
          render();
        }
        await wait(250);
        typingText.current = "";
        completedLines.current = [...completedLines.current, line];
        render();
      } else {
        await wait(line.delay);
        completedLines.current = [...completedLines.current, line];
        render();
      }
    }
    isDone.current = true;
    typingText.current = "";
    render();
  }

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      timerRef.current = setTimeout(resolve, ms);
    });
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleCopyLine = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedLine(idx);
    setTimeout(() => setCopiedLine(null), 2000);
  }, []);

  function handleClose() {
    setIsFullscreen(false);
    setIsVisible(false);
  }

  function handleMinimize() {
    setIsFullscreen(false);
    setIsMinimized(true);
  }

  function handleFullscreen() {
    setIsMinimized(false);
    setIsFullscreen(!isFullscreen);
  }

  // Restore from minimized
  function handleRestore() {
    setIsMinimized(false);
    setIsVisible(true);
  }

  const isCurrentlyTyping = typingText.current.length > 0 && !isDone.current;

  // Render a single terminal line
  function renderLine(line: TerminalLine, idx: number) {
    const isCommand = line.type === "command" && line.copyText;
    const isCopied = copiedLine === idx;

    return (
      <div
        key={idx}
        onClick={isCommand ? () => handleCopyLine(line.copyText!, idx) : undefined}
        style={{
          color: COLORS[line.type],
          height: `${LINE_HEIGHT}px`,
          lineHeight: `${LINE_HEIGHT}px`,
          cursor: isCommand ? "pointer" : "default",
          borderRadius: isCommand ? "4px" : undefined,
          padding: isCommand ? "0 4px" : undefined,
          margin: isCommand ? "0 -4px" : undefined,
          background: isCopied ? "rgba(50,215,75,0.08)" : isCommand ? undefined : undefined,
          transition: "background 200ms ease",
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (isCommand && !isCopied) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        }}
        onMouseLeave={(e) => {
          if (isCommand && !isCopied) e.currentTarget.style.background = "transparent";
        }}
      >
        {isCommand ? (
          <>
            {/* $ prefix — not selectable, not copied on triple-click */}
            <span style={{ userSelect: "none", WebkitUserSelect: "none", color: "rgba(255,255,255,0.3)" }}>
              ${"\u00A0"}
            </span>
            <span>{line.text.slice(2)}</span>
            {/* Copied indicator */}
            {isCopied && (
              <span style={{
                marginLeft: "auto",
                fontSize: "11px",
                color: "#32d74b",
                fontWeight: 500,
                paddingRight: "4px",
              }}>
                copied
              </span>
            )}
          </>
        ) : (
          <span style={{ minHeight: line.text === "" ? `${LINE_HEIGHT}px` : undefined, display: "inline-block" }}>
            {line.text}
          </span>
        )}
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div
        onClick={handleRestore}
        style={{
          position: "fixed",
          left: "40px",
          top: "60px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          borderRadius: "100px",
          background: "rgba(30,30,30,0.9)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
        }}
      >
        <LockerLogo size={18} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
          Terminal
        </span>
      </div>
    );
  }

  // ── Hidden (closed) ──
  if (!isVisible) {
    return null;
  }

  // ── Stoplight dot with hover symbol ──
  function StoplightDot({
    color,
    symbol,
    id,
    onClick,
  }: {
    color: string;
    symbol: string;
    id: string;
    onClick: () => void;
  }) {
    const isHovered = hoveredDot === id;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onMouseEnter={() => setHoveredDot(id)}
        onMouseLeave={() => setHoveredDot(null)}
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "transform 100ms ease",
          transform: isHovered ? "scale(1.15)" : "scale(1)",
        }}
      >
        {hoveredDot !== null && (
          <span style={{
            fontSize: "8px",
            fontWeight: 800,
            lineHeight: 1,
            color: "rgba(0,0,0,0.5)",
          }}>
            {symbol}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        borderRadius: isFullscreen ? "0" : "16px",
        overflow: "hidden",
        border: isFullscreen ? "none" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isFullscreen ? "none" : "0 16px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        transition: "all 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        ...(isFullscreen
          ? {
              position: "fixed" as const,
              inset: 0,
              zIndex: 9999,
            }
          : {}),
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          background: "#1a1a1a",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          gap: "8px",
        }}
      >
        <div
          style={{ display: "flex", gap: "7px" }}
          onMouseLeave={() => setHoveredDot(null)}
        >
          <StoplightDot color="#ff5f57" symbol="✕" id="close" onClick={handleClose} />
          <StoplightDot color="#febc2e" symbol="−" id="minimize" onClick={handleMinimize} />
          <StoplightDot color="#28c840" symbol="⤢" id="fullscreen" onClick={handleFullscreen} />
        </div>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-mono)",
          }}
        >
          locker &mdash; zsh
        </span>
        <div style={{ width: 52 }} />
      </div>

      {/* Body — fixed height, no expansion */}
      <div
        ref={containerRef}
        style={{
          padding: `${BODY_PADDING}px 22px`,
          background: "#0d0d0d",
          fontFamily: "var(--font-mono)",
          fontSize: "13.5px",
          height: isFullscreen ? "calc(100vh - 44px)" : `${BODY_HEIGHT}px`,
          overflow: "hidden",
          transition: "height 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {completedLines.current.map((line, i) => renderLine(line, i))}

        {/* Typing line */}
        {isCurrentlyTyping && (
          <div style={{
            color: COLORS.command,
            height: `${LINE_HEIGHT}px`,
            lineHeight: `${LINE_HEIGHT}px`,
            display: "flex",
            alignItems: "center",
          }}>
            <span style={{ userSelect: "none", color: "rgba(255,255,255,0.3)" }}>
              ${"\u00A0"}
            </span>
            {typingText.current.slice(2)}
            <span
              style={{
                display: "inline-block",
                width: "7px",
                height: "15px",
                background: "rgba(255,255,255,0.7)",
                marginLeft: "1px",
                animation: "blink 1s step-end infinite",
              }}
            />
          </div>
        )}

        {/* Frozen idle prompt */}
        {isDone.current && (
          <div style={{
            color: "rgba(255,255,255,0.4)",
            height: `${LINE_HEIGHT}px`,
            lineHeight: `${LINE_HEIGHT}px`,
            display: "flex",
            alignItems: "center",
          }}>
            <span style={{ userSelect: "none" }}>$&nbsp;</span>
            <span
              style={{
                display: "inline-block",
                width: "7px",
                height: "15px",
                background: "rgba(255,255,255,0.7)",
                animation: "blink 1s step-end infinite",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
