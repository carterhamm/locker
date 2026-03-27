"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FadingBorder } from "@/components/FadingBorder";

interface Integration {
  id: string;
  name: string;
  connected: boolean;
  connectedEmail: string | null;
  connectedAt: string | null;
}

export default function IntegrationsPage() {
  const { token } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
        if (!authToken) return;
        const res = await fetch("/api/integrations", { headers: { Authorization: `Bearer ${authToken}` } });
        if (res.ok) {
          const data = await res.json();
          setIntegrations(data.integrations || []);
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function connect(providerId: string) {
    const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
    if (!authToken) return;
    const res = await fetch(`/api/integrations/${providerId}/connect`, { headers: { Authorization: `Bearer ${authToken}` } });
    if (res.ok) {
      const data = await res.json();
      window.location.href = data.url;
    }
  }

  async function disconnect(providerId: string) {
    const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
    if (!authToken) return;
    await fetch(`/api/integrations/${providerId}`, { method: "DELETE", headers: { Authorization: `Bearer ${authToken}` } });
    setIntegrations(prev => prev.map(i => i.id === providerId ? { ...i, connected: false, connectedEmail: null, connectedAt: null } : i));
  }

  if (loading) {
    return <div style={{ color: "var(--text-tertiary)", padding: "40px 0", fontFamily: "var(--font-body)" }}>Loading...</div>;
  }

  const connected = integrations.filter(i => i.connected);
  const available = integrations.filter(i => !i.connected);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "6px" }}>
          Integrations
        </h2>
        <p style={{ color: "var(--text-tertiary)", fontSize: "13px", fontFamily: "var(--font-body)" }}>
          Connect services to let agents retrieve keys automatically.
        </p>
      </div>

      {connected.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
            Connected
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {connected.map(i => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", position: "relative", overflow: "hidden" }}>
                <FadingBorder radius="var(--radius-md)" />
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-sm)", background: "rgba(50,215,75,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--success)", textTransform: "uppercase" }}>
                    {i.name.slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-body)", marginBottom: "2px" }}>{i.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                      {i.connectedEmail || "Connected"}
                      {i.connectedAt && ` \u2022 ${new Date(i.connectedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <button onClick={() => disconnect(i.id)} style={{ padding: "6px 14px", borderRadius: "100px", border: "none", background: "rgba(239,68,68,0.08)", color: "var(--error)", fontSize: "12px", fontWeight: 500, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <h3 style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
            Available
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
            {available.map(i => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.02)", position: "relative", overflow: "hidden" }}>
                <FadingBorder radius="var(--radius-md)" />
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    {i.name.slice(0, 2)}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-body)" }}>{i.name}</span>
                </div>
                <button onClick={() => connect(i.id)} style={{ padding: "5px 14px", borderRadius: "100px", border: "none", background: "#ffffff", color: "#000000", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-body)", cursor: "pointer" }}>
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {integrations.length === 0 && (
        <div style={{ padding: "60px 40px", textAlign: "center", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.015)", position: "relative", overflow: "hidden" }}>
          <FadingBorder radius="var(--radius-lg)" colorFaded="rgba(255,255,255,0.01)" />
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "6px", fontFamily: "var(--font-body)" }}>No integrations available yet</p>
          <p style={{ color: "var(--text-tertiary)", fontSize: "13px", fontFamily: "var(--font-body)" }}>Check back soon for new service connections.</p>
        </div>
      )}
    </div>
  );
}
