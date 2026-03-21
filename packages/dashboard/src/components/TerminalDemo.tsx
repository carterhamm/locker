"use client";

import { useEffect, useState, useRef } from "react";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "comment" | "success";
  delay: number; // ms after previous line completes
}

const DEMO_LINES: TerminalLine[] = [
  { text: "# Install the CLI", type: "comment", delay: 300 },
  { text: "$ npm install -g locker-cli", type: "command", delay: 100 },
  { text: "added 42 packages in 2.1s", type: "output", delay: 800 },
  { text: "", type: "output", delay: 400 },
  { text: "# Login once — that's it", type: "comment", delay: 200 },
  { text: "$ locker login", type: "command", delay: 100 },
  { text: "Email: carter@nexus-ai.com", type: "output", delay: 600 },
  { text: "✓ Logged in as carter@nexus-ai.com", type: "success", delay: 500 },
  { text: "", type: "output", delay: 400 },
  { text: "# Any agent retrieves keys instantly", type: "comment", delay: 200 },
  { text: "$ locker get openai", type: "command", delay: 100 },
  { text: "sk-proj-aBcDeFgHiJkLmNoPqRsT...", type: "success", delay: 400 },
  { text: "", type: "output", delay: 600 },
  { text: "$ locker get resend", type: "command", delay: 100 },
  { text: "re_aBcDeFgHiJkLmNoPqRsT...", type: "success", delay: 400 },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [typingIndex, setTypingIndex] = useState<number>(0);
  const [currentTyped, setCurrentTyped] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start when visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  // Animate lines
  useEffect(() => {
    if (!started || visibleLines >= DEMO_LINES.length) return;

    const line = DEMO_LINES[visibleLines];

    if (line.type === "command" && !isTyping) {
      // Start typing this command
      setIsTyping(true);
      setCurrentTyped("");
      setTypingIndex(0);
      return;
    }

    if (isTyping) {
      const text = DEMO_LINES[visibleLines].text;
      if (typingIndex < text.length) {
        const timer = setTimeout(() => {
          setCurrentTyped(text.slice(0, typingIndex + 1));
          setTypingIndex(typingIndex + 1);
        }, 30 + Math.random() * 30); // Variable typing speed
        return () => clearTimeout(timer);
      } else {
        // Done typing this line
        setIsTyping(false);
        const timer = setTimeout(() => {
          setVisibleLines(visibleLines + 1);
        }, 150);
        return () => clearTimeout(timer);
      }
    }

    // Non-command lines just appear after their delay
    const timer = setTimeout(() => {
      setVisibleLines(visibleLines + 1);
    }, line.delay);
    return () => clearTimeout(timer);
  }, [started, visibleLines, isTyping, typingIndex]);

  // Auto-scroll terminal
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
          minHeight: "320px",
          maxHeight: "380px",
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
              animationDelay: "0ms",
              minHeight: line.text === "" ? "12px" : undefined,
            }}
          >
            {line.text}
          </div>
        ))}
        {/* Currently typing line */}
        {isTyping && (
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
        {/* Idle cursor */}
        {!isTyping && visibleLines >= DEMO_LINES.length && (
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
