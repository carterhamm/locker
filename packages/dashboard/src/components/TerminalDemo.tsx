"use client";

import { useEffect, useRef, useReducer, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { LockerLogo } from "./Icons";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "comment" | "success";
  delay: number;
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

const LH = 23;
const BODY_PAD = 20;
const BODY_H = (LINES.length + 1) * LH + BODY_PAD * 2;

export function TerminalDemo() {
  const [, forceRender] = useReducer((x: number) => x + 1, 0);
  const [mode, setMode] = useState<"normal" | "minimized" | "fullscreen" | "closed">("normal");
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);

  const completedLines = useRef<TerminalLine[]>([]);
  const typingText = useRef("");
  const isDone = useRef(false);
  const isRunning = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Start animation when scrolled into view
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !isRunning.current && !isDone.current) {
          isRunning.current = true;
          obs.disconnect();
          animate();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function render() { forceRender(); }

  function wait(ms: number): Promise<void> {
    return new Promise(r => { timerRef.current = setTimeout(r, ms); });
  }

  async function animate() {
    for (const line of LINES) {
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

  const copyLine = useCallback(async (text: string, idx: number) => {
    try { await navigator.clipboard.writeText(text); } catch {
      const t = document.createElement("textarea"); t.value = text;
      document.body.appendChild(t); t.select(); document.execCommand("copy");
      document.body.removeChild(t);
    }
    setCopiedLine(idx);
    setTimeout(() => setCopiedLine(null), 2000);
  }, []);

  const typing = typingText.current.length > 0 && !isDone.current;

  // ── Closed ──
  if (mode === "closed") return null;

  // ── Minimized: circle with Locker logo, left-aligned with nav logo (left: 40px) ──
  if (mode === "minimized") {
    return (
      <div
        onClick={() => setMode("normal")}
        style={{
          position: "fixed",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1000,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "rgba(30,30,30,0.95)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(20px)",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        }}
        title="Restore terminal"
      >
        <LockerLogo size={20} />
      </div>
    );
  }

  // ── Stoplight dot ──
  function Dot({ color, sym, id, fn }: { color: string; sym: string; id: string; fn: () => void }) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); fn(); }}
        onMouseEnter={() => setHoveredDot(id)}
        onMouseLeave={() => setHoveredDot(null)}
        style={{
          width: 12, height: 12, borderRadius: "50%", background: color,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "transform 100ms ease",
          transform: hoveredDot === id ? "scale(1.15)" : "scale(1)",
        }}
      >
        {hoveredDot !== null && (
          <span style={{ fontSize: "8px", fontWeight: 800, lineHeight: 1, color: "rgba(0,0,0,0.5)" }}>
            {sym}
          </span>
        )}
      </div>
    );
  }

  // ── Line renderer ──
  function Line({ line, idx }: { line: TerminalLine; idx: number }) {
    const cmd = line.type === "command" && line.copyText;
    const copied = copiedLine === idx;
    return (
      <div
        onClick={cmd ? () => copyLine(line.copyText!, idx) : undefined}
        style={{
          color: COLORS[line.type], height: LH, lineHeight: `${LH}px`,
          cursor: cmd ? "pointer" : "default",
          borderRadius: cmd ? 4 : undefined,
          padding: cmd ? "0 4px" : undefined, margin: cmd ? "0 -4px" : undefined,
          background: copied ? "rgba(50,215,75,0.08)" : "transparent",
          transition: "background 200ms ease",
          display: "flex", alignItems: "center",
        }}
        onMouseEnter={(e) => { if (cmd && !copied) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
        onMouseLeave={(e) => { if (cmd && !copied) e.currentTarget.style.background = "transparent"; }}
      >
        {cmd ? (
          <>
            <span style={{ userSelect: "none", WebkitUserSelect: "none", color: "rgba(255,255,255,0.3)" }}>${"\u00A0"}</span>
            <span>{line.text.slice(2)}</span>
            {copied && <span style={{ marginLeft: "auto", fontSize: 11, color: "#32d74b", fontWeight: 500, paddingRight: 4 }}>copied</span>}
          </>
        ) : (
          <span style={{ minHeight: line.text === "" ? LH : undefined, display: "inline-block" }}>{line.text}</span>
        )}
      </div>
    );
  }

  const isFS = mode === "fullscreen";

  // Shared terminal content (used in both normal and fullscreen)
  function TerminalContent({ fullscreen }: { fullscreen: boolean }) {
    return (
      <div
        style={fullscreen ? {
          position: "fixed",
          top: "5vh", left: "5vw", right: "5vw", bottom: "5vh",
          zIndex: 9999,
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 100px rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
        } : {
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 16px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", padding: "12px 16px",
          background: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 8,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 7 }} onMouseLeave={() => setHoveredDot(null)}>
            <Dot color="#ff5f57" sym="✕" id="c" fn={() => setMode("closed")} />
            <Dot color="#febc2e" sym="−" id="m" fn={() => setMode("minimized")} />
            <Dot color="#28c840" sym="⤢" id="f" fn={() => setMode(fullscreen ? "normal" : "fullscreen")} />
          </div>
          <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)" }}>
            locker &mdash; zsh
          </span>
          <div style={{ width: 52 }} />
        </div>

        <div
          ref={fullscreen ? undefined : bodyRef}
          style={{
            padding: `${BODY_PAD}px 22px`,
            background: "#0d0d0d",
            fontFamily: "var(--font-mono)",
            fontSize: "13.5px",
            height: fullscreen ? undefined : BODY_H,
            overflow: fullscreen ? "auto" : "hidden",
            flex: fullscreen ? 1 : undefined,
          }}
        >
          {completedLines.current.map((line, i) => <Line key={i} line={line} idx={i} />)}

          {typing && (
            <div style={{ color: COLORS.command, height: LH, lineHeight: `${LH}px`, display: "flex", alignItems: "center" }}>
              <span style={{ userSelect: "none", color: "rgba(255,255,255,0.3)" }}>${"\u00A0"}</span>
              {typingText.current.slice(2)}
              <span style={{ display: "inline-block", width: 7, height: 15, background: "rgba(255,255,255,0.7)", marginLeft: 1, animation: "blink 1s step-end infinite" }} />
            </div>
          )}

          {isDone.current && (
            <div style={{ color: "rgba(255,255,255,0.4)", height: LH, lineHeight: `${LH}px`, display: "flex", alignItems: "center" }}>
              <span style={{ userSelect: "none" }}>$&nbsp;</span>
              <span style={{ display: "inline-block", width: 7, height: 15, background: "rgba(255,255,255,0.7)", animation: "blink 1s step-end infinite" }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fullscreen uses a portal to escape all parent clipping
  if (isFS) {
    return createPortal(
      <>
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={() => setMode("normal")}
        />
        <TerminalContent fullscreen />
      </>,
      document.body
    );
  }

  return <TerminalContent fullscreen={false} />;
}
