"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";

interface LogEntry {
  id: string;
  service: string;
  accessedAt: string;
  agentIdentifier: string | null;
}

export default function LogsPage() {
  const { theme } = useTheme();
  const { token } = useAuth();
  const isTerminal = theme === "terminal";

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/logs?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch {
        // Silently fail — logs are non-critical
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div style={{ color: "var(--text-tertiary)", padding: "40px 0", fontFamily: "var(--font-body)" }}>
        {isTerminal ? "Loading logs..." : "Loading..."}
      </div>
    );
  }

  return (
    <div>
      {isTerminal ? (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", marginBottom: "16px" }}>
          <span style={{ color: "var(--text-accent)" }}>$</span> locker logs --limit 100
        </div>
      ) : (
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "32px" }}>
          Access Logs
        </h1>
      )}

      {logs.length === 0 ? (
        <div style={{ padding: isTerminal ? "20px 0" : "60px", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-body)", fontSize: "14px" }}>
          {isTerminal ? "No access logs yet." : "No access logs yet. Logs appear when keys are retrieved."}
        </div>
      ) : isTerminal ? (
        /* Terminal table */
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: "1.8" }}>
          <div style={{ color: "var(--text-accent)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "4px", marginBottom: "4px" }}>
            {"TIMESTAMP".padEnd(22)}{"SERVICE".padEnd(16)}{"AGENT"}
          </div>
          {logs.map((log, i) => (
            <div key={log.id} className="animate-in" style={{ animationDelay: `${i * 20}ms`, color: "var(--text-secondary)" }}>
              {new Date(log.accessedAt).toISOString().slice(0, 19).replace("T", " ").padEnd(22)}
              {log.service.padEnd(16)}
              {log.agentIdentifier || "-"}
            </div>
          ))}
        </div>
      ) : (
        /* Modern table */
        <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 500, fontSize: "12px", letterSpacing: "0.04em" }}>
                  Timestamp
                </th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 500, fontSize: "12px", letterSpacing: "0.04em" }}>
                  Service
                </th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 500, fontSize: "12px", letterSpacing: "0.04em" }}>
                  Agent
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  className="animate-in"
                  style={{
                    animationDelay: `${i * 20}ms`,
                    borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    {new Date(log.accessedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                    {log.service}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {log.agentIdentifier || (
                      <span style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
