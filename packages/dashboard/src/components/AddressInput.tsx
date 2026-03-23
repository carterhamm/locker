"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Suggestion {
  full_address: string;
  place_name?: string;
  mapbox_id: string;
}

export function AddressInput({
  value,
  onChange,
  onBlur,
  placeholder = "123 Main St, City, State ZIP",
  style = {},
}: {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&session_token=locker-address&language=en&country=us&types=address&limit=5`
      );
      if (res.ok) {
        const data = await res.json();
        const items = (data.suggestions || []).map((s: any) => ({
          full_address: s.full_address || s.name || "",
          place_name: s.place_name,
          mapbox_id: s.mapbox_id,
        }));
        setSuggestions(items);
        setShowDropdown(items.length > 0);
        setActiveIdx(-1);
      }
    } catch {
      // Silently fail
    }
  }, []);

  function handleChange(val: string) {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  }

  function selectSuggestion(s: Suggestion) {
    onChange(s.full_address);
    setShowDropdown(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
        onBlur={() => { onBlur?.(); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "none",
          background: "rgba(255,255,255,0.04)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          outline: "none",
          ...style,
        }}
      />
      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            borderRadius: "10px",
            background: "rgba(30,30,30,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            zIndex: 100,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s.mapbox_id}
              onClick={() => selectSuggestion(s)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: "10px 14px",
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                color: "var(--text-primary)",
                cursor: "pointer",
                background: i === activeIdx ? "rgba(255,255,255,0.06)" : "transparent",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                transition: "background 100ms ease",
              }}
            >
              {s.full_address}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
