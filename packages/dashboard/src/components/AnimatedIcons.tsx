"use client";

import { motion } from "framer-motion";

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Shield with lock — shackle bounces on hover
export function AnimShieldLock({ hover }: { hover: boolean }) {
  return (
    <svg {...iconProps}>
      <motion.path
        d="M12 2L3 7v5c0 5.25 3.75 10.13 9 11.25C17.25 22.13 21 17.25 21 12V7l-9-5z"
        animate={{ scale: hover ? 1.05 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{ transformOrigin: "center" }}
      />
      <rect x="9.5" y="10" width="5" height="4.5" rx="0.5" />
      <motion.path
        d="M10.5 10V8.5a1.5 1.5 0 0 1 3 0V10"
        animate={{ y: hover ? -1.5 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 12 }}
      />
    </svg>
  );
}

// Audit log — lines slide in on hover
export function AnimAuditLog({ hover }: { hover: boolean }) {
  return (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
      <polyline points="14 2 14 8 20 8" />
      <motion.line
        x1="8" y1="13" x2="16" y2="13"
        animate={{ x2: hover ? 16 : 12, opacity: hover ? 1 : 0.7 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      <motion.line
        x1="8" y1="17" x2="13" y2="17"
        animate={{ x2: hover ? 13 : 10, opacity: hover ? 1 : 0.7 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
      />
    </svg>
  );
}

// Terminal — cursor blinks on hover
export function AnimTerminal({ hover }: { hover: boolean }) {
  return (
    <svg {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <motion.polyline
        points="7 9 10 12 7 15"
        animate={{ x: hover ? 0.5 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      />
      <motion.line
        x1="13" y1="15" x2="17" y2="15"
        animate={{
          opacity: hover ? [1, 0.3, 1] : 1,
          x2: hover ? 17 : 15,
        }}
        transition={{
          opacity: { duration: 0.8, repeat: hover ? Infinity : 0, ease: "linear" },
          x2: { duration: 0.2 },
        }}
      />
    </svg>
  );
}

// Bolt — flash effect on hover
export function AnimBolt({ hover }: { hover: boolean }) {
  return (
    <svg {...iconProps}>
      <motion.polygon
        points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
        animate={{
          scale: hover ? [1, 1.15, 1] : 1,
          strokeWidth: hover ? 2 : 1.5,
        }}
        transition={{
          scale: { duration: 0.4, ease: "easeOut" },
          strokeWidth: { duration: 0.2 },
        }}
        style={{ transformOrigin: "center" }}
      />
    </svg>
  );
}

// Scope/target — rings pulse on hover
export function AnimKeyScope({ hover }: { hover: boolean }) {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <motion.circle
        cx="12" cy="12" r="8"
        animate={{
          r: hover ? [8, 8.8, 8] : 8,
          opacity: hover ? [1, 0.6, 1] : 1,
        }}
        transition={{ duration: 1.2, repeat: hover ? Infinity : 0, ease: "easeInOut" }}
      />
      <line x1="12" y1="1" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="23" />
      <line x1="1" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="23" y2="12" />
    </svg>
  );
}

// Globe — rotates on hover
export function AnimGlobe({ hover }: { hover: boolean }) {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <motion.ellipse
        cx="12" cy="12" rx="4" ry="10"
        animate={{ rx: hover ? [4, 6, 4] : 4 }}
        transition={{ duration: 2, repeat: hover ? Infinity : 0, ease: "easeInOut" }}
      />
      <line x1="2" y1="12" x2="22" y2="12" />
      <motion.path
        d="M4.5 7h15"
        animate={{ opacity: hover ? 0.8 : 0.6 }}
      />
      <motion.path
        d="M4.5 17h15"
        animate={{ opacity: hover ? 0.8 : 0.6 }}
      />
    </svg>
  );
}
