"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { FadingBorder } from "@/components/FadingBorder";
import { ShieldLockIcon, BoltIcon, AuditLogIcon } from "@/components/Icons";

interface StoredKey {
  service: string;
  createdAt: string;
  lastUsed: string | null;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        padding: "24px",
        borderRadius: "var(--radius-lg)",
        background: "rgba(255,255,255,0.02)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <FadingBorder radius="var(--radius-lg)" />
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--text-tertiary)" }}>
        {icon}
        <span style={{ fontSize: "12px", fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

export default function KeysPage() {
  const { token } = useAuth();

  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState("");
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isDemo = token?.startsWith("eyJkZW1vIjp0cnVlfQ");

  async function fetchKeys() {
    if (isDemo) { setLoading(false); return; }
    try {
      const res = await fetch("/api/keys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.services || []);
      }
    } catch {
      // API not running
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchKeys();
  }, [token]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service: newService, key: newKey }),
      });
      if (res.ok) {
        setSuccess(`Key stored for ${newService}`);
        setNewService("");
        setNewKey("");
        setShowAdd(false);
        fetchKeys();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to store key");
      }
    } catch {
      if (isDemo) {
        setKeys(prev => [...prev, { service: newService.toLowerCase().trim(), createdAt: new Date().toISOString(), lastUsed: null }]);
        setSuccess(`Key stored for ${newService}`);
        setNewService("");
        setNewKey("");
        setShowAdd(false);
      } else {
        setError("Cannot connect to API. Is the server running?");
      }
    }
  }

  async function handleRevoke(service: string) {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/keys/${encodeURIComponent(service)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSuccess(`Key revoked for ${service}`);
        fetchKeys();
      }
    } catch {
      setError("Failed to revoke key");
    }
  }

  if (loading) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)", padding: "40px 0" }}>
        Loading...
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    border: "none",
    background: "rgba(255,255,255,0.04)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    outline: "none",
    transition: "box-shadow 150ms ease",
  };

  return (
    <div>
      {/* Stat cards row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
        <StatCard
          icon={<ShieldLockIcon size={16} />}
          label="Stored Keys"
          value={String(keys.length)}
        />
        <StatCard
          icon={<BoltIcon size={16} />}
          label="Retrievals"
          value="—"
        />
        <StatCard
          icon={<AuditLogIcon size={16} />}
          label="Last Access"
          value="—"
        />
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em" }}>
          Your Keys
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: "8px 20px",
            borderRadius: "100px",
            border: "none",
            background: "#ffffff",
            color: "#000000",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
        >
          {showAdd ? "Cancel" : "+ Add Key"}
        </button>
      </div>

      {/* Status messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: "12px 18px",
              borderRadius: "var(--radius-md)",
              background: "rgba(239,68,68,0.08)",
              color: "var(--error)",
              fontSize: "13px",
              marginBottom: "16px",
              fontFamily: "var(--font-body)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <FadingBorder radius="var(--radius-md)" color="rgba(239,68,68,0.2)" colorFaded="rgba(239,68,68,0.04)" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: "12px 18px",
              borderRadius: "var(--radius-md)",
              background: "rgba(34,197,94,0.08)",
              color: "var(--success)",
              fontSize: "13px",
              marginBottom: "16px",
              fontFamily: "var(--font-body)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <FadingBorder radius="var(--radius-md)" color="rgba(34,197,94,0.2)" colorFaded="rgba(34,197,94,0.04)" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Key Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden", marginBottom: "24px" }}
            onSubmit={handleAdd}
          >
            <div
              style={{
                padding: "24px",
                borderRadius: "var(--radius-lg)",
                background: "rgba(255,255,255,0.02)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <FadingBorder radius="var(--radius-lg)" />
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", marginBottom: "6px", color: "var(--text-tertiary)", fontSize: "11px", fontFamily: "var(--font-body)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Service
                  </label>
                  <input type="text" value={newService} onChange={(e) => setNewService(e.target.value)} required placeholder="openai" style={inputStyle} />
                </div>
                <div style={{ flex: "2 1 300px" }}>
                  <label style={{ display: "block", marginBottom: "6px", color: "var(--text-tertiary)", fontSize: "11px", fontFamily: "var(--font-body)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    API Key
                  </label>
                  <input type="password" value={newKey} onChange={(e) => setNewKey(e.target.value)} required placeholder="sk-..." style={inputStyle} />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: "12px 28px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                    background: "#ffffff",
                    color: "#000000",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Store Key
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Keys List */}
      {keys.length === 0 ? (
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
          <div style={{ marginBottom: "16px", opacity: 0.3, display: "flex", justifyContent: "center" }}>
            <ShieldLockIcon size={40} />
          </div>
          <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "15px", marginBottom: "6px" }}>
            No API keys stored yet
          </p>
          <p style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)", fontSize: "13px" }}>
            Click &quot;+ Add Key&quot; to store your first key
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {keys.map((k, i) => (
            <motion.div
              key={k.service}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 22px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.02)",
                transition: "all 200ms ease",
                position: "relative",
                overflow: "hidden",
                cursor: "default",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <FadingBorder radius="var(--radius-md)" />
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  {k.service.slice(0, 2)}
                </div>
                <div>
                  <div style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "2px",
                  }}>
                    {k.service}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>
                    Added {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsed && ` \u2022 Last used ${new Date(k.lastUsed).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRevoke(k.service)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "100px",
                  border: "none",
                  background: "rgba(239,68,68,0.08)",
                  color: "var(--error)",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                Revoke
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
