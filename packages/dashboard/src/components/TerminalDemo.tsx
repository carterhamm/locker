"use client";

import { useEffect, useRef, useReducer } from "react";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "comment" | "success";
  delay: number;
}

const LINES: TerminalLine[] = [
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

const COLORS: Record<string, string> = {
  command: "#e2e2e2",
  output: "rgba(255,255,255,0.4)",
  comment: "rgba(255,255,255,0.25)",
  success: "#32d74b",
};

/**
 * Imperative animation driven by refs — immune to strict mode double-fire.
 * React state is only used to trigger re-renders for display.
 */
export function TerminalDemo() {
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  // All animation state in refs so strict mode can't reset it
  const completedLines = useRef<TerminalLine[]>([]);
  const typingText = useRef("");
  const isDone = useRef(false);
  const isRunning = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start when scrolled into view
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
    // Auto-scroll
    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  async function runAnimation() {
    for (let i = 0; i < LINES.length; i++) {
      const line = LINES[i];

      if (line.type === "command") {
        // Type character by character
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
        // Output/comment/success — appear after delay
        await wait(line.delay);
        completedLines.current = [...completedLines.current, line];
        render();
      }
    }

    // Done — freeze forever
    isDone.current = true;
    typingText.current = "";
    render();
  }

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      timerRef.current = setTimeout(resolve, ms);
    });
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isCurrentlyTyping = typingText.current.length > 0 && !isDone.current;

  return (
    <div
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow:
          "0 16px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
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
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
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

      {/* Body */}
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
        {completedLines.current.map((line, i) => (
          <div
            key={i}
            style={{
              color: COLORS[line.type],
              minHeight: line.text === "" ? "12px" : undefined,
            }}
          >
            {line.text}
          </div>
        ))}

        {/* Typing cursor */}
        {isCurrentlyTyping && (
          <div style={{ color: COLORS.command }}>
            {typingText.current}
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 16,
                background: "rgba(255,255,255,0.7)",
                marginLeft: 1,
                verticalAlign: "text-bottom",
                animation: "blink 1s step-end infinite",
              }}
            />
          </div>
        )}

        {/* Frozen idle prompt */}
        {isDone.current && (
          <div style={{ color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            ${" "}
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 16,
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
