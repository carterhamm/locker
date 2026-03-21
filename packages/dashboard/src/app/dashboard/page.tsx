"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";

interface StoredKey {
  service: string;
  createdAt: string;
  lastUsed: string | null;
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
      // API not running — don't show error for demo
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
        setSuccess(`Key stored for ${newService} (demo mode)`);
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          API Keys
        </h1>

        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: "8px 20px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "#ffffff",
            color: "#000000",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          {showAdd ? "Cancel" : "Add Key"}
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div style={{
          padding: "10px 16px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          color: "var(--error)",
          fontSize: "13px",
          marginBottom: "16px",
          fontFamily: "var(--font-body)",
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: "10px 16px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "var(--success)",
          fontSize: "13px",
          marginBottom: "16px",
          fontFamily: "var(--font-body)",
        }}>
          {success}
        </div>
      )}

      {/* Add Key Form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          style={{
            padding: "24px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", marginBottom: "4px", color: "var(--text-secondary)", fontSize: "12px", fontFamily: "var(--font-body)", letterSpacing: "0.02em" }}>
                Service name
              </label>
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                required
                placeholder="e.g. openai, resend, stripe"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-medium)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ flex: "2 1 300px" }}>
              <label style={{ display: "block", marginBottom: "4px", color: "var(--text-secondary)", fontSize: "12px", fontFamily: "var(--font-body)", letterSpacing: "0.02em" }}>
                API Key
              </label>
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
                placeholder="sk-..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-medium)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "10px 24px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "#ffffff",
                color: "#000000",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0",
                whiteSpace: "nowrap",
              }}
            >
              Store Key
            </button>
          </div>
        </form>
      )}

      {/* Keys List */}
      {keys.length === 0 ? (
        <div style={{
          padding: "60px",
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          border: "1px dashed var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
        }}>
          <p style={{ marginBottom: "8px" }}>No API keys stored yet</p>
          <p style={{ fontSize: "13px" }}>Click &quot;Add Key&quot; to store your first key</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {keys.map((k, i) => (
            <div
              key={k.service}
              className="animate-in"
              style={{
                animationDelay: `${i * 40}ms`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-card)",
                transition: `all var(--duration-fast) ease`,
              }}
            >
              <div>
                <div style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "2px",
                }}>
                  {k.service}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Added {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsed && ` \u2022 Last used ${new Date(k.lastUsed).toLocaleDateString()}`}
                </div>
              </div>
              <button
                onClick={() => handleRevoke(k.service)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "transparent",
                  color: "var(--error)",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  cursor: "pointer",
                  letterSpacing: "0",
                }}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
