"use client";
import { useRef, useCallback } from 'react';

// ============================================================================
// DAMPED SPRING PHYSICS
// Solves: x'' + 2ζω x' + ω² x = 0
// Using Verlet integration for stability
// k = spring constant (5-10), ζ = damping ratio (0.8-1.2)
// ω = sqrt(k/m), m = 1 (unit mass)
// ============================================================================

interface SpringState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  active: boolean;
}

interface SpringConfig {
  stiffness: number;   // k: spring constant (default 8)
  damping: number;     // ζ: damping ratio (default 0.85)
  mass: number;        // m: mass (default 1)
  restThreshold: number; // Stop when displacement < this (default 0.5px)
}

const DEFAULT_CONFIG: SpringConfig = {
  stiffness: 8,
  damping: 0.85,
  mass: 1,
  restThreshold: 0.5,
};

export function useSpring(config: Partial<SpringConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const stateRef = useRef<SpringState>({
    x: 0, y: 0, vx: 0, vy: 0,
    targetX: 0, targetY: 0, active: false,
  });
  const rafRef = useRef<number>(0);
  const callbackRef = useRef<((x: number, y: number) => void) | null>(null);
  const lastTimeRef = useRef<number>(0);

  const step = useCallback(() => {
    const s = stateRef.current;
    if (!s.active) return;

    const now = performance.now();
    // Cap dt to avoid spiral of death after tab switch
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.033);
    lastTimeRef.current = now;

    // Displacement from target
    const dx = s.x - s.targetX;
    const dy = s.y - s.targetY;

    // Spring force: F = -k * x
    // Damping force: F = -b * v, where b = 2 * ζ * sqrt(k * m)
    const omega = Math.sqrt(cfg.stiffness / cfg.mass);
    const b = 2 * cfg.damping * omega * cfg.mass;

    const ax = (-cfg.stiffness * dx - b * s.vx) / cfg.mass;
    const ay = (-cfg.stiffness * dy - b * s.vy) / cfg.mass;

    // Verlet integration
    s.vx += ax * dt;
    s.vy += ay * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    // Check if at rest
    const disp = Math.sqrt(dx * dx + dy * dy);
    const vel = Math.sqrt(s.vx * s.vx + s.vy * s.vy);

    if (disp < cfg.restThreshold && vel < cfg.restThreshold) {
      s.x = s.targetX;
      s.y = s.targetY;
      s.vx = 0;
      s.vy = 0;
      s.active = false;
      callbackRef.current?.(s.x, s.y);
      return;
    }

    callbackRef.current?.(s.x, s.y);
    rafRef.current = requestAnimationFrame(step);
  }, [cfg.stiffness, cfg.damping, cfg.mass, cfg.restThreshold]);

  const snapTo = useCallback((targetX: number, targetY: number, fromX: number, fromY: number, onUpdate: (x: number, y: number) => void) => {
    cancelAnimationFrame(rafRef.current);
    const s = stateRef.current;
    s.x = fromX;
    s.y = fromY;
    s.targetX = targetX;
    s.targetY = targetY;
    s.active = true;
    callbackRef.current = onUpdate;
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(step);
  }, [step]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    stateRef.current.active = false;
  }, []);

  const isActive = useCallback(() => stateRef.current.active, []);

  return { snapTo, stop, isActive };
}
