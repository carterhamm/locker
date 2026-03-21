"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "comment" | "success";
  delay: number;
}

const DEMO_LINES: TerminalLine[] = [
  { text: "# Install the CLI", type: "comment", delay: 500 },
  { text: "$ npm install -g locker-cli", type: "command", delay: 200 },
  { text: "added 42 packages in 2.1s", type: "output", delay: 1200 },
  { text: "", type: "output", delay: 600 },
  { text: "# Login once — that's it", type: "comment", delay: 400 },
  { text: "$ locker login", type: "command", delay: 200 },
  { text: "Email: carter@nexus-ai.com", type: "output", delay: 900 },
  { text: "✓ Logged in as carter@nexus-ai.com", type: "success", delay: 700 },
  { text: "", type: "output", delay: 700 },
  { text: "# Any agent retrieves keys instantly", type: "comment", delay: 400 },
  { text: "$ locker get openai", type: "command", delay: 200 },
  { text: "sk-proj-aBcDeFgHiJkLmNoPqRsT...", type: "success", delay: 600 },
  { text: "", type: "output", delay: 900 },
  { text: "$ locker get resend", type: "command", delay: 200 },
  { text: "re_aBcDeFgHiJkLmNoPqRsT...", type: "success", delay: 600 },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [typingIndex, setTypingIndex] = useState<number>(0);
  const [currentTyped, setCurrentTyped] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Start when visible (once)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || started) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  // Main animation driver
  useEffect(() => {
    if (!started || done) return;
    if (visibleLines >= DEMO_LINES.length) {
      setDone(true);
      return;
    }

    const line = DEMO_LINES[visibleLines];

    if (line.type === "command" && !isTyping) {
      setIsTyping(true);
      setCurrentTyped("");
      setTypingIndex(0);
      return;
    }

    if (isTyping) {
      const text = DEMO_LINES[visibleLines].text;
      if (typingIndex < text.length) {
        timerRef.current = setTimeout(() => {
          setCurrentTyped(text.slice(0, typingIndex + 1));
          setTypingIndex(typingIndex + 1);
        }, 45 + Math.random() * 40);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
      } else {
        setIsTyping(false);
        timerRef.current = setTimeout(() => {
          setVisibleLines((v) => v + 1);
        }, 250);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
      }
    }

    timerRef.current = setTimeout(() => {
      setVisibleLines((v) => v + 1);
    }, line.delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [started, done, visibleLines, isTyping, typingIndex]);

  // Auto-scroll
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleLines, currentTyped]);

  const colorMap: Record<string, string> = {
    command: "#e2e2e2",
    output: "rgba(255,255,255,0.4)",
    comment: "rgba(255,255,255,0.25)",
    success: "#32d74b",
  };

  return (
    <div
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 16px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
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
        <div style={{ display: "flex", gap: "7px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28c840" }} />
        </div>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.03em",
          }}
        >
          locker &mdash; zsh
        </span>
        <div style={{ width: "52px" }} />
      </div>

      {/* Terminal body */}
      <div
        ref={containerRef}
        style={{
          padding: "20px 22px",
          background: "#0d0d0d",
          fontFamily: "var(--font-mono)",
          fontSize: "13.5px",
          lineHeight: "1.7",
          minHeight: "340px",
          maxHeight: "400px",
          overflow: "auto",
        }}
      >
        {DEMO_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            style={{
              color: colorMap[line.type],
              opacity: 0,
              animation: "termLineIn 0.3s ease forwards",
              minHeight: line.text === "" ? "12px" : undefined,
            }}
          >
            {line.text}
          </div>
        ))}
        {/* Currently typing line */}
        {isTyping && !done && (
          <div style={{ color: colorMap["command"] }}>
            {currentTyped}
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "16px",
                background: "rgba(255,255,255,0.7)",
                marginLeft: "1px",
                verticalAlign: "text-bottom",
                animation: "blink 1s step-end infinite",
              }}
            />
          </div>
        )}
        {/* Frozen idle cursor — stays forever once done */}
        {done && (
          <div style={{ color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
            ${" "}
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "16px",
                background: "rgba(255,255,255,0.7)",
                verticalAlign: "text-bottom",
                animation: "blink 1s step-end infinite",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
