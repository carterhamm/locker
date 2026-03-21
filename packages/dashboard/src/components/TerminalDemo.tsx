"use client";

import { useEffect, useRef, useReducer, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  const [mounted, setMounted] = useState(false);
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const [fsExiting, setFsExiting] = useState(false);

  const completedLines = useRef<TerminalLine[]>([]);
  const typingText = useRef("");
  const isDone = useRef(false);
  const isRunning = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Start animation when scrolled into view
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !isRunning.current && !isDone.current) {
          isRunning.current = true;
          obs.disconnect();
          runAnimation();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // Esc exits fullscreen
  useEffect(() => {
    if (mode !== "fullscreen") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFsExiting(true);
        setMode("normal");
        setTimeout(() => setFsExiting(false), 500);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  function render() { forceRender(); }

  function wait(ms: number): Promise<void> {
    return new Promise(r => { timerRef.current = setTimeout(r, ms); });
  }

  async function runAnimation() {
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

  function handleRestore() {
    setMode("normal");
    // Scroll back to the demo section
    setTimeout(() => {
      wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const typing = typingText.current.length > 0 && !isDone.current;
  const isFS = mode === "fullscreen";

  if (mode === "closed") return null;

  // ── Stoplight dot — 28x28 tap target ──
  function Dot({ color, sym, id, fn }: { color: string; sym: string; id: string; fn: () => void }) {
    return (
      <div
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); fn(); }}
        onMouseEnter={() => setHoveredDot(id)}
        onMouseLeave={() => setHoveredDot(null)}
        style={{
          width: 28, height: 28,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "50%",
        }}
      >
        <div style={{
          width: 12, height: 12, borderRadius: "50%", background: color,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 100ms ease",
          transform: hoveredDot === id ? "scale(1.15)" : "scale(1)",
        }}>
          {hoveredDot !== null && (
            <span style={{ fontSize: "8px", fontWeight: 800, lineHeight: 1, color: "rgba(0,0,0,0.5)" }}>
              {sym}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Line renderer ──
  function LineRow({ line, idx }: { line: TerminalLine; idx: number }) {
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

  // Terminal body content (shared)
  const termBody = (
    <>
      {completedLines.current.map((line, i) => <LineRow key={i} line={line} idx={i} />)}
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
    </>
  );

  const titleBar = (
    <div style={{
      display: "flex", alignItems: "center", padding: "12px 16px",
      background: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 8,
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", gap: 0, margin: "-8px", marginRight: 0 }} onMouseLeave={() => setHoveredDot(null)}>
        <Dot color="#ff5f57" sym="✕" id="c" fn={() => setMode("closed")} />
        <Dot color="#febc2e" sym="−" id="m" fn={() => setMode("minimized")} />
        <Dot color="#28c840" sym="⤢" id="f" fn={() => {
          if (!isFS && wrapperRef.current) {
            setSourceRect(wrapperRef.current.getBoundingClientRect());
          }
          setMode(isFS ? "normal" : "fullscreen");
        }} />
      </div>
      <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)" }}>
        locker &mdash; zsh
      </span>
      <div style={{ width: 52 }} />
    </div>
  );

  // ── Minimized pill — portaled, genie from terminal position to pill ──
  if (mode === "minimized" && mounted) {
    // Get the terminal's last known position for the animation start
    const rect = wrapperRef.current?.getBoundingClientRect();
    const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const startY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    // Target position
    const endX = 30; // left: 8px + half of 44px
    const endY = window.innerHeight * 0.65;

    return (
      <>
        <div ref={wrapperRef} style={{ height: 0, overflow: "hidden" }}>
          <div ref={bodyRef} />
        </div>
        {createPortal(
          <motion.div
            initial={{
              width: rect?.width || 400,
              height: rect?.height || 300,
              borderRadius: 16,
              x: startX - (rect?.width || 400) / 2,
              y: startY - (rect?.height || 300) / 2,
              opacity: 1,
            }}
            animate={{
              width: 44,
              height: 44,
              borderRadius: 22,
              x: endX - 22,
              y: endY - 22,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              damping: 26,
              stiffness: 180,
              mass: 0.9,
            }}
            onClick={handleRestore}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 1000,
              background: "rgba(30,30,30,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
            whileHover={{ scale: 1.1 }}
            title="Restore terminal"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: "spring", damping: 20, stiffness: 300 }}
            >
              <LockerLogo size={20} />
            </motion.div>
          </motion.div>,
          document.body
        )}
      </>
    );
  }

  // ── Fullscreen — portaled, with enter AND exit animation ──
  const showFullscreen = (isFS || fsExiting) && mounted;

  function exitFullscreen() {
    setFsExiting(true);
    setMode("normal");
    // Keep portal mounted for 500ms to play exit animation
    setTimeout(() => setFsExiting(false), 500);
  }

  if (showFullscreen) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const pad = 0.03;
    const fsX = vw * pad;
    const fsY = vh * pad;
    const fsW = vw * (1 - pad * 2);
    const fsH = vh * (1 - pad * 2);
    const sr = sourceRect || { left: vw * 0.15, top: vh * 0.3, width: vw * 0.7, height: vh * 0.4 };

    // Are we currently expanded or collapsing?
    const expanded = isFS && !fsExiting;

    return (
      <>
        <div ref={wrapperRef} style={{ height: 0, overflow: "hidden" }}>
          <div ref={bodyRef} />
        </div>
        {createPortal(
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: expanded ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", pointerEvents: expanded ? "auto" : "none" }}
              onClick={exitFullscreen}
            />
            {/* Window — initial from source rect, animate to fullscreen or back */}
            <motion.div
              initial={{
                x: sr.left,
                y: sr.top,
                width: sr.width,
                height: sr.height,
                borderRadius: 16,
              }}
              animate={{
                x: expanded ? fsX : sr.left,
                y: expanded ? fsY : sr.top,
                width: expanded ? fsW : sr.width,
                height: expanded ? fsH : sr.height,
                borderRadius: expanded ? 12 : 16,
              }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 200,
                mass: 0.8,
              }}
              style={{
                position: "fixed", top: 0, left: 0, zIndex: 9999,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 32px 100px rgba(0,0,0,0.7)",
                display: "flex", flexDirection: "column",
              }}
            >
              {/* Inline titlebar for fullscreen (with exit function) */}
              <div style={{
                display: "flex", alignItems: "center", padding: "12px 16px",
                background: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 8,
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", gap: 0, margin: "-8px", marginRight: 0 }} onMouseLeave={() => setHoveredDot(null)}>
                  <Dot color="#ff5f57" sym="✕" id="c" fn={() => { exitFullscreen(); setTimeout(() => setMode("closed"), 500); }} />
                  <Dot color="#febc2e" sym="−" id="m" fn={() => { exitFullscreen(); setTimeout(() => setMode("minimized"), 500); }} />
                  <Dot color="#28c840" sym="⤢" id="f" fn={exitFullscreen} />
                </div>
                <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)" }}>
                  locker &mdash; zsh
                </span>
                <div style={{ width: 52 }} />
              </div>
              <div style={{
                padding: `${BODY_PAD}px 22px`, background: "#0d0d0d",
                fontFamily: "var(--font-mono)", fontSize: "13.5px",
                flex: 1, overflow: "auto",
              }}>
                {termBody}
              </div>
            </motion.div>
          </>,
          document.body
        )}
      </>
    );
  }

  // ── Normal inline — with motion wrapper for expand animation ──
  return (
    <div ref={wrapperRef}>
      <motion.div
        style={{
          borderRadius: "16px", overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 16px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        {titleBar}
        <div ref={bodyRef} style={{
          padding: `${BODY_PAD}px 22px`, background: "#0d0d0d",
          fontFamily: "var(--font-mono)", fontSize: "13.5px",
          height: BODY_H, overflow: "hidden",
        }}>
          {termBody}
        </div>
      </motion.div>
    </div>
  );
}
