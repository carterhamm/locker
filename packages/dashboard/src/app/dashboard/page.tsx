"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
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
  const [alert, setAlert] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceInputRef = useRef<HTMLInputElement>(null);

  function showAlert(msg: string, type: "success" | "error") {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setAlert({ msg, type });
    alertTimerRef.current = setTimeout(() => setAlert(null), 3000);
  }

  const isDemo = token?.startsWith("eyJkZW1vIjp0cnVlfQ");

  const pollFailedRef = useRef(false);

  async function fetchKeys() {
    if (isDemo) { setLoading(false); return; }
    if (pollFailedRef.current) return;
    try {
      // Use Bearer token directly — Next.js rewrites strip cookies
      const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
      if (!authToken || authToken.startsWith("eyJkZW1v")) {
        setLoading(false);
        return;
      }
      const res = await fetch("/api/keys", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        pollFailedRef.current = true;
        return;
      }
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

  // Esc cancels Add Key mode
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && showAdd) {
        setShowAdd(false);
        setAlert(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAdd]);

  // Live refresh — poll every 5 seconds for new keys
  useEffect(() => {
    if (!token || isDemo) return;
    const interval = setInterval(fetchKeys, 5000);
    return () => clearInterval(interval);
  }, [token, isDemo]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAlert(null);

    const serviceName = newService.toLowerCase().trim();
    if (keys.some((k) => k.service === serviceName)) {
      showAlert(`"${serviceName}" already exists`, "error");
      return;
    }

    try {
      const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ service: newService, key: newKey }),
      });
      if (res.ok) {
        showAlert(`Stored: ${newService}`, "success");
        setNewService("");
        setNewKey("");
        setShowAdd(false);
        fetchKeys();
      } else {
        const data = await res.json();
        const msg = data.error || "Failed";
        showAlert(msg.length > 30 ? msg.slice(0, 30) + "…" : msg, "error");
      }
    } catch {
      if (isDemo) {
        setKeys(prev => [...prev, { service: newService.toLowerCase().trim(), createdAt: new Date().toISOString(), lastUsed: null }]);
        showAlert(`Stored: ${newService}`, "success");
        setNewService("");
        setNewKey("");
        setShowAdd(false);
      } else {
        showAlert("Cannot connect to API", "error");
      }
    }
  }

  const [updatingService, setUpdatingService] = useState<string | null>(null);
  const [updateKey, setUpdateKey] = useState("");

  async function handleUpdate(service: string) {
    if (!updateKey) return;
    setAlert(null);
    try {
      const authToken = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
      // Revoke old
      await fetch(`/api/keys/${encodeURIComponent(service)}`, {
        method: "DELETE",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      // Store new
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ service, key: updateKey }),
      });
      if (res.ok) {
        showAlert(`Updated: ${service}`, "success");
        setUpdatingService(null);
        setUpdateKey("");
        fetchKeys();
      } else {
        showAlert("Update failed", "error");
      }
    } catch {
      showAlert("Update failed", "error");
    }
  }

  async function handleRevoke(service: string) {
    setAlert(null);
    try {
      const authToken2 = (token && token !== "cookie") ? token : localStorage.getItem("locker-token");
      const res = await fetch(`/api/keys/${encodeURIComponent(service)}`, {
        method: "DELETE",
        headers: authToken2 ? { Authorization: `Bearer ${authToken2}` } : {},
      });
      if (res.ok) {
        showAlert(`Revoked: ${service}`, "success");
        fetchKeys();
      }
    } catch {
      showAlert("Revoke failed", "error");
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

      {/* Header with inline pill alerts */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.01em" }}>
          Your Keys
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AnimatePresence>
            {alert && (
              <motion.div
                key={alert.msg}
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "100px",
                  background: alert.type === "success" ? "rgba(50,215,75,0.1)" : "rgba(239,68,68,0.1)",
                  color: alert.type === "success" ? "var(--success)" : "var(--error)",
                  fontSize: alert.msg.length > 20 ? "11px" : "12px",
                  fontWeight: 500,
                  fontFamily: "var(--font-body)",
                  whiteSpace: "nowrap",
                }}
              >
                {alert.type === "success" ? "✓ " : ""}{alert.msg}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => { setShowAdd(!showAdd); if (!showAdd) setTimeout(() => serviceInputRef.current?.focus(), 100); }}
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
      </div>

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
            autoComplete="locker-no-autofill"
          >
            {/* Hidden fields to prevent browser password autofill */}
            <input type="text" name="prevent-autofill-1" style={{display: "none"}} tabIndex={-1} />
            <input type="password" name="prevent-autofill-2" style={{display: "none"}} tabIndex={-1} />
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
                  <input ref={serviceInputRef} type="text" value={newService} onChange={(e) => setNewService(e.target.value)} required placeholder="openai" autoComplete="off" data-1p-ignore data-lpignore="true" style={inputStyle} />
                </div>
                <div style={{ flex: "2 1 300px" }}>
                  <label style={{ display: "block", marginBottom: "6px", color: "var(--text-tertiary)", fontSize: "11px", fontFamily: "var(--font-body)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    API Key
                  </label>
                  <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} required placeholder="sk-..." autoComplete="off" data-1p-ignore data-lpignore="true" style={{...inputStyle, ...({WebkitTextSecurity: "disc"} as React.CSSProperties)}} />
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
            padding: "48px 40px",
            borderRadius: "var(--radius-lg)",
            background: "rgba(255,255,255,0.015)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <FadingBorder radius="var(--radius-lg)" colorFaded="rgba(255,255,255,0.01)" />
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ marginBottom: "16px", opacity: 0.3, display: "flex", justifyContent: "center" }}>
              <ShieldLockIcon size={40} />
            </div>
            <p style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 600, marginBottom: "6px" }}>
              Get started in 3 steps
            </p>
            <p style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-body)", fontSize: "13px" }}>
              Store your first API key and start using Locker
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", flexShrink: 0, marginTop: "1px" }}>1</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-body)", marginBottom: "2px" }}>Add a key</div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-body)" }}>Click &quot;+ Add Key&quot; above, or use the Chrome extension</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", flexShrink: 0, marginTop: "1px" }}>2</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-body)", marginBottom: "2px" }}>Install the CLI</div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>npm install -g locker-cli</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", flexShrink: 0, marginTop: "1px" }}>3</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-body)", marginBottom: "2px" }}>Retrieve from anywhere</div>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>locker get openai</div>
              </div>
            </div>
          </div>
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {updatingService === k.service ? (
                  <>
                    <input
                      type="text"
                      value={updateKey}
                      onChange={(e) => setUpdateKey(e.target.value)}
                      placeholder="New key..."
                      autoFocus
                      autoComplete="off"
                      data-1p-ignore
                      onKeyDown={(e) => { if (e.key === "Escape") { setUpdatingService(null); setUpdateKey(""); } if (e.key === "Enter") handleUpdate(k.service); }}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "none",
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        outline: "none",
                        width: "140px",
                        ...({WebkitTextSecurity: "disc"} as React.CSSProperties),
                      }}
                    />
                    <button
                      onClick={() => handleUpdate(k.service)}
                      style={{
                        padding: "5px 12px", borderRadius: "100px", border: "none",
                        background: "#ffffff", color: "#000000",
                        fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setUpdatingService(null); setUpdateKey(""); }}
                      style={{
                        padding: "5px 10px", borderRadius: "100px", border: "none",
                        background: "rgba(255,255,255,0.04)", color: "var(--text-tertiary)",
                        fontFamily: "var(--font-body)", fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setUpdatingService(k.service); setUpdateKey(""); }}
                      style={{
                        padding: "6px 14px", borderRadius: "100px", border: "none",
                        background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 500,
                        cursor: "pointer", transition: "all 150ms ease",
                      }}
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleRevoke(k.service)}
                      style={{
                        padding: "6px 14px", borderRadius: "100px", border: "none",
                        background: "rgba(239,68,68,0.08)", color: "var(--error)",
                        fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 500,
                        cursor: "pointer", transition: "all 150ms ease",
                      }}
                    >
                      Revoke
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
