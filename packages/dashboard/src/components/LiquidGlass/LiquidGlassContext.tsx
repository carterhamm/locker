"use client";
import React, { createContext, useContext, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// LIQUID GLASS CONTEXT
// Global registry for all LG elements enabling inter-element communication:
// - Position tracking for proximity detection
// - Z-index grouping for morph eligibility
// - Peer color sampling for reflections
// - Merge state machine: approaching → held → releasing
// - Velocity tracking for fling-to-merge detection
// ============================================================================

export interface LGElementInfo {
  id: string;
  x: number;          // Center X in viewport px
  y: number;          // Center Y in viewport px
  width: number;
  height: number;
  zIndex: number;
  shape: 'rectangle' | 'circle' | 'pill';
  originX: number;    // Rest position X (for snap-back)
  originY: number;    // Rest position Y
  avgColor: [number, number, number]; // Average color for reflection bleeding
  velocityX: number;  // px/s
  velocityY: number;  // px/s
  cornerRadiusPx: number;   // Actual pixel corner radius (for concentric computation)
  nestedInId: string | null; // Parent element ID if nested
}

export interface ProximityInfo {
  peerId: string;
  distance: number;         // Euclidean distance between centers
  overlapRatio: number;     // 0 = no overlap, 1 = fully overlapping
  contactAngle: number;     // Angle from this element to peer (radians)
  contactPoint: [number, number]; // Midpoint between edges along contact axis
  peerColor: [number, number, number];
  mergeState: number;       // 0=approaching, 1=held, 2=releasing
  holdProgress: number;     // 0-1 merge progress
  releaseTime: number;      // seconds since release started
}

// --- Merge state tracking ---

interface MergePairState {
  state: 'approaching' | 'held' | 'releasing';
  firstOverlapTime: number;    // ms when overlap first detected
  holdAchievedTime: number;    // ms when hold triggered
  releaseStartTime: number;    // ms when release began
  maxOverlap: number;          // peak overlap during this merge
}

const HOLD_OVERLAP = 1.2;         // overlapRatio needed to enter hold
const HOLD_DELAY_MS = 300;        // ms of sustained overlap before hold
const RIPPLE_DURATION_MS = 1200;  // ms of release ripple animation

function getPairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function computeMergeState(
  pairs: Map<string, MergePairState>,
  key: string,
  overlap: number,
  now: number,
  selfVelocity: number,
  peerVelocity: number,
): { mergeState: number; holdProgress: number; releaseTime: number } {
  let pair = pairs.get(key);

  if (!pair) {
    if (overlap < 0.01) return { mergeState: 0, holdProgress: 0, releaseTime: 0 };
    pair = {
      state: 'approaching',
      firstOverlapTime: now,
      holdAchievedTime: 0,
      releaseStartTime: 0,
      maxOverlap: overlap,
    };
    pairs.set(key, pair);
  }

  pair.maxOverlap = Math.max(pair.maxOverlap, overlap);

  // Fling: reduce hold delay based on approach velocity
  const flingFactor = Math.min((selfVelocity + peerVelocity) / 500, 1);
  const adjustedDelay = HOLD_DELAY_MS * (1 - flingFactor * 0.7);

  switch (pair.state) {
    case 'approaching':
      if (overlap >= HOLD_OVERLAP && (now - pair.firstOverlapTime) > adjustedDelay) {
        pair.state = 'held';
        pair.holdAchievedTime = now;
      } else if (overlap < 0.01) {
        pairs.delete(key);
        return { mergeState: 0, holdProgress: 0, releaseTime: 0 };
      }
      break;
    case 'held':
      if (overlap < HOLD_OVERLAP * 0.7) { // hysteresis prevents flicker
        pair.state = 'releasing';
        pair.releaseStartTime = now;
      }
      break;
    case 'releasing':
      if (overlap >= HOLD_OVERLAP) {
        // Re-merging during release
        pair.state = 'held';
        pair.holdAchievedTime = now;
      } else if ((now - pair.releaseStartTime) > RIPPLE_DURATION_MS) {
        pairs.delete(key);
        return { mergeState: 0, holdProgress: 0, releaseTime: 0 };
      }
      break;
  }

  let mergeState = 0;
  let holdProgress = 0;
  let releaseTime = 0;

  switch (pair.state) {
    case 'approaching':
      mergeState = 0;
      holdProgress = Math.min((now - pair.firstOverlapTime) / Math.max(adjustedDelay, 1), 0.9);
      break;
    case 'held':
      mergeState = 1;
      holdProgress = 1.0;
      break;
    case 'releasing':
      mergeState = 2;
      releaseTime = (now - pair.releaseStartTime) / 1000; // seconds
      holdProgress = Math.max(0, 1 - releaseTime / (RIPPLE_DURATION_MS / 1000));
      break;
  }

  return { mergeState, holdProgress, releaseTime };
}

interface LGContextValue {
  register: (info: LGElementInfo) => void;
  unregister: (id: string) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateColor: (id: string, color: [number, number, number]) => void;
  updateVelocity: (id: string, vx: number, vy: number) => void;
  updateCornerRadius: (id: string, rpx: number) => void;
  nestElement: (childId: string, parentId: string) => void;
  unnestElement: (childId: string) => void;
  getProximityPeers: (id: string, threshold?: number) => ProximityInfo[];
  getElement: (id: string) => LGElementInfo | undefined;
  getAllElements: () => LGElementInfo[];
}

const LGContext = createContext<LGContextValue | null>(null);

export const useLiquidGlassContext = () => {
  const ctx = useContext(LGContext);
  if (!ctx) throw new Error('LiquidGlass must be wrapped in <LiquidGlassProvider>');
  return ctx;
};

export const LiquidGlassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const elementsRef = useRef<Map<string, LGElementInfo>>(new Map());
  const mergePairsRef = useRef<Map<string, MergePairState>>(new Map());

  const register = useCallback((info: LGElementInfo) => {
    elementsRef.current.set(info.id, info);
  }, []);

  const unregister = useCallback((id: string) => {
    elementsRef.current.delete(id);
    // Clean up merge pairs involving this element
    const pairs = mergePairsRef.current;
    for (const key of Array.from(pairs.keys())) {
      if (key.includes(id)) pairs.delete(key);
    }
  }, []);

  const updatePosition = useCallback((id: string, x: number, y: number) => {
    const el = elementsRef.current.get(id);
    if (el) { el.x = x; el.y = y; }
  }, []);

  const updateColor = useCallback((id: string, color: [number, number, number]) => {
    const el = elementsRef.current.get(id);
    if (el) { el.avgColor = color; }
  }, []);

  const updateVelocity = useCallback((id: string, vx: number, vy: number) => {
    const el = elementsRef.current.get(id);
    if (el) { el.velocityX = vx; el.velocityY = vy; }
  }, []);

  const updateCornerRadius = useCallback((id: string, rpx: number) => {
    const el = elementsRef.current.get(id);
    if (el) { el.cornerRadiusPx = rpx; }
  }, []);

  const nestElement = useCallback((childId: string, parentId: string) => {
    const child = elementsRef.current.get(childId);
    if (child) child.nestedInId = parentId;
  }, []);

  const unnestElement = useCallback((childId: string) => {
    const child = elementsRef.current.get(childId);
    if (child) child.nestedInId = null;
  }, []);

  const getElement = useCallback((id: string) => {
    return elementsRef.current.get(id);
  }, []);

  const getAllElements = useCallback(() => {
    return Array.from(elementsRef.current.values());
  }, []);

  // ============================================================================
  // PROXIMITY DETECTION + MERGE STATE
  // Euclidean distance between centers, adjusted by element radii
  // Only same-z elements can interact
  // Merge state machine: approaching → held → releasing
  // ============================================================================

  const getProximityPeers = useCallback((id: string, threshold = 30): ProximityInfo[] => {
    const self = elementsRef.current.get(id);
    if (!self) return [];

    const results: ProximityInfo[] = [];
    const now = performance.now();
    const pairs = mergePairsRef.current;

    elementsRef.current.forEach((peer, peerId) => {
      if (peerId === id) return;
      if (peer.zIndex !== self.zIndex) return;
      // Skip parent-child pairs from morphing
      if (self.nestedInId === peerId || peer.nestedInId === id) return;

      const dx = peer.x - self.x;
      const dy = peer.y - self.y;
      const centerDist = Math.sqrt(dx * dx + dy * dy);

      const selfR = (self.width + self.height) * 0.25;
      const peerR = (peer.width + peer.height) * 0.25;
      const edgeDist = centerDist - selfR - peerR;

      const pairKey = getPairKey(id, peerId);
      const existingPair = pairs.get(pairKey);

      // Include peer if: within threshold OR in active merge (for ripple continuation)
      if (edgeDist >= threshold) {
        if (!existingPair || existingPair.state === 'approaching') {
          if (existingPair) pairs.delete(pairKey);
          return;
        }
        // Active held/releasing pair — keep for ripple even if out of range
      }

      const overlap = Math.max(0, 1 - edgeDist / threshold);
      const clampedOverlap = Math.min(overlap, 2.5);

      const selfVel = Math.sqrt((self.velocityX || 0) ** 2 + (self.velocityY || 0) ** 2);
      const peerVel = Math.sqrt((peer.velocityX || 0) ** 2 + (peer.velocityY || 0) ** 2);

      const { mergeState, holdProgress, releaseTime } = computeMergeState(
        pairs, pairKey, clampedOverlap, now, selfVel, peerVel,
      );

      const angle = Math.atan2(dy, dx);
      const selfEdge = selfR / Math.max(centerDist, 0.001);
      const cpX = self.x + dx * selfEdge;
      const cpY = self.y + dy * selfEdge;

      results.push({
        peerId,
        distance: edgeDist,
        overlapRatio: clampedOverlap,
        contactAngle: angle,
        contactPoint: [cpX, cpY],
        peerColor: peer.avgColor || [0.5, 0.5, 0.5],
        mergeState,
        holdProgress,
        releaseTime,
      });
    });

    return results;
  }, []);

  const value = useMemo<LGContextValue>(() => ({
    register, unregister, updatePosition, updateColor, updateVelocity,
    updateCornerRadius, nestElement, unnestElement,
    getProximityPeers, getElement, getAllElements,
  }), [register, unregister, updatePosition, updateColor, updateVelocity,
    updateCornerRadius, nestElement, unnestElement,
    getProximityPeers, getElement, getAllElements]);

  return <LGContext.Provider value={value}>{children}</LGContext.Provider>;
};
