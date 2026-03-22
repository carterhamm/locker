"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { FadingBorder } from "@/components/FadingBorder";

interface LogEntry {
  id: string;
  service: string;
  accessedAt: string;
  agentIdentifier: string | null;
}

export default function LogsPage() {
  const { token } = useAuth();

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
        // Silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div style={{ color: "var(--text-tertiary)", padding: "40px 0", fontFamily: "var(--font-body)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "6px" }}>
          Access Logs
        </h2>
        <p style={{ color: "var(--text-tertiary)", fontSize: "13px", fontFamily: "var(--font-body)" }}>
          Every key retrieval is logged with timestamp, service, and agent.
        </p>
      </div>

      {logs.length === 0 ? (
        <div
          style={{
            padding: "60px 40px",
            textAlign: "center",
            borderRadius: "var(--radius-lg)",
            background: "rgba(255,255,255,0.015)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <FadingBorder radius="var(--radius-lg)" colorFaded="rgba(255,255,255,0.01)" />
          <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "14px", marginBottom: "6px" }}>
            No access logs yet
          </p>
          <p style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)", fontSize: "13px" }}>
            Logs appear when keys are retrieved via CLI or API
          </p>
        </div>
      ) : (
        <div
          style={{
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            position: "relative",
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <FadingBorder radius="var(--radius-lg)" />
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ textAlign: "left", padding: "14px 20px", color: "var(--text-tertiary)", fontWeight: 500, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Timestamp
                </th>
                <th style={{ textAlign: "left", padding: "14px 20px", color: "var(--text-tertiary)", fontWeight: 500, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Service
                </th>
                <th style={{ textAlign: "left", padding: "14px 20px", color: "var(--text-tertiary)", fontWeight: 500, fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Agent
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "14px 20px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    {new Date(log.accessedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 20px", fontWeight: 500 }}>
                    {log.service}
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--text-secondary)" }}>
                    {log.agentIdentifier || (
                      <span style={{ color: "var(--text-tertiary)" }}>&mdash;</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
