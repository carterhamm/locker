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

// Shield — bigger shield (28px), same-size lock, tilts on hover
export function AnimShieldLock({ hover }: { hover: boolean }) {
  return (
    <motion.svg
      width={28} height={28} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"
      animate={{ rotate: hover ? -6 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 12 }}
    >
      <motion.path
        d="M12 2L3 7v5c0 5.25 3.75 10.13 9 11.25C17.25 22.13 21 17.25 21 12V7l-9-5z"
        animate={{ scale: hover ? 1.05 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{ transformOrigin: "center" }}
      />
      <rect x="9.5" y="10" width="5" height="4.5" rx="0.5" strokeWidth="1.5" />
      <motion.path
        d="M10.5 10V8.5a1.5 1.5 0 0 1 3 0V10"
        strokeWidth="1.5"
        animate={{ y: hover ? -3 : 0, rotate: hover ? -20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 10 }}
        style={{ transformOrigin: "13.5px 10px" }}
      />
    </motion.svg>
  );
}

// Audit log — page flips + lines stagger in
export function AnimAuditLog({ hover }: { hover: boolean }) {
  return (
    <motion.svg
      {...iconProps}
      animate={{ rotateY: hover ? 15 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      style={{ transformOrigin: "left center" }}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
      <polyline points="14 2 14 8 20 8" />
      <motion.line
        x1="8" y1="13" x2={hover ? 16 : 11} y2="13"
        animate={{ x2: hover ? 16 : 11 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      <motion.line
        x1="8" y1="17" x2={hover ? 14 : 10} y2="17"
        animate={{ x2: hover ? 14 : 10 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.08 }}
      />
    </motion.svg>
  );
}

// Terminal — chevron bounces + cursor block blinks
export function AnimTerminal({ hover }: { hover: boolean }) {
  return (
    <svg {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <motion.polyline
        points="7 9 10 12 7 15"
        animate={{ x: hover ? 1.5 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 12 }}
      />
      <motion.rect
        x="13" y="14" width={hover ? 5 : 4} height="2" rx="0.5"
        fill="currentColor" stroke="none"
        animate={{
          opacity: hover ? [1, 0, 1] : 0.6,
          width: hover ? 5 : 4,
        }}
        transition={{
          opacity: { duration: 0.6, repeat: hover ? Infinity : 0 },
          width: { duration: 0.2 },
        }}
      />
    </svg>
  );
}

// Bolt — flashes bright, scales up and down
export function AnimBolt({ hover }: { hover: boolean }) {
  return (
    <motion.svg
      {...iconProps}
      animate={{
        scale: hover ? [1, 1.25, 0.95, 1.1] : 1,
        rotate: hover ? [0, -8, 4, 0] : 0,
      }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
    >
      <motion.polygon
        points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
        animate={{ strokeWidth: hover ? 2 : 1.5 }}
        transition={{ duration: 0.15 }}
      />
    </motion.svg>
  );
}

// Scope — outer ring pulses outward, crosshairs extend
export function AnimKeyScope({ hover }: { hover: boolean }) {
  return (
    <svg {...iconProps}>
      <motion.circle
        cx="12" cy="12" r="3"
        animate={{ r: hover ? 3.5 : 3, fill: hover ? "rgba(255,255,255,0.1)" : "transparent" }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      />
      <motion.circle
        cx="12" cy="12" r="8"
        animate={{
          r: hover ? 9 : 8,
          strokeDasharray: hover ? "4 4" : "none",
          opacity: hover ? [1, 0.5, 1] : 1,
        }}
        transition={{
          r: { type: "spring", stiffness: 300, damping: 12 },
          opacity: { duration: 1.5, repeat: hover ? Infinity : 0, ease: "easeInOut" },
        }}
      />
      <motion.line x1="12" y1={hover ? 0 : 1} x2="12" y2="4" animate={{ y1: hover ? 0 : 1 }} transition={{ duration: 0.2 }} />
      <motion.line x1="12" y1="20" x2="12" y2={hover ? 24 : 23} animate={{ y2: hover ? 24 : 23 }} transition={{ duration: 0.2 }} />
      <motion.line x1={hover ? 0 : 1} y1="12" x2="4" y2="12" animate={{ x1: hover ? 0 : 1 }} transition={{ duration: 0.2 }} />
      <motion.line x1="20" y1="12" x2={hover ? 24 : 23} y2="12" animate={{ x2: hover ? 24 : 23 }} transition={{ duration: 0.2 }} />
    </svg>
  );
}

// Globe — spins with wobble
export function AnimGlobe({ hover }: { hover: boolean }) {
  return (
    <motion.svg
      {...iconProps}
      animate={{ rotateY: hover ? 360 : 0 }}
      transition={{ duration: 2, ease: "linear", repeat: hover ? Infinity : 0 }}
      style={{ transformOrigin: "center" }}
    >
      <circle cx="12" cy="12" r="10" />
      <motion.ellipse
        cx="12" cy="12" rx="4" ry="10"
        animate={{ rx: hover ? [4, 8, 4, 1, 4] : 4 }}
        transition={{ duration: 2, repeat: hover ? Infinity : 0, ease: "linear" }}
      />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M4.5 7h15" opacity={0.5} />
      <path d="M4.5 17h15" opacity={0.5} />
    </motion.svg>
  );
}
