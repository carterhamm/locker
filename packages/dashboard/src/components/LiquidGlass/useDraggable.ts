"use client";
import { useRef, useCallback, useEffect } from 'react';
import { useSpring } from './useSpring';

// ============================================================================
// DRAGGABLE HOOK — v2
// Default: elements stay where dropped (no snap-back)
// Optional spring snap-back if explicitly enabled
// ============================================================================

interface DragState {
  isDragging: boolean;
  startMouseX: number;
  startMouseY: number;
  startElX: number;
  startElY: number;
  currentX: number;
  currentY: number;
}

interface UseDraggableOptions {
  enabled?: boolean;
  snapBack?: boolean;
  originX?: number;
  originY?: number;
  springStiffness?: number;
  springDamping?: number;
  onDragStart?: () => void;
  onDrag?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number, metaKey: boolean) => void;
  onPositionChange?: (x: number, y: number) => void;
}

export function useDraggable(options: UseDraggableOptions = {}) {
  const {
    enabled = true,
    snapBack = false, // Default: stay where dropped
    originX = 0,
    originY = 0,
    springStiffness = 8,
    springDamping = 0.85,
    onDragStart,
    onDrag,
    onDragEnd,
    onPositionChange,
  } = options;

  const stateRef = useRef<DragState>({
    isDragging: false,
    startMouseX: 0, startMouseY: 0,
    startElX: 0, startElY: 0,
    currentX: 0, currentY: 0,
  });

  const spring = useSpring({ stiffness: springStiffness, damping: springDamping });
  const elementRef = useRef<HTMLDivElement>(null);

  const setPosition = useCallback((x: number, y: number) => {
    stateRef.current.currentX = x;
    stateRef.current.currentY = y;
    if (elementRef.current) {
      elementRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
    onPositionChange?.(x, y);
  }, [onPositionChange]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();

    spring.stop();

    const s = stateRef.current;
    s.isDragging = true;
    s.startMouseX = e.clientX;
    s.startMouseY = e.clientY;
    s.startElX = s.currentX;
    s.startElY = s.currentY;

    // Capture on the outer element, not e.target (which might be a child)
    elementRef.current?.setPointerCapture(e.pointerId);
    onDragStart?.();
  }, [enabled, spring, onDragStart]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!stateRef.current.isDragging) return;
    const s = stateRef.current;
    const newX = s.startElX + (e.clientX - s.startMouseX);
    const newY = s.startElY + (e.clientY - s.startMouseY);
    setPosition(newX, newY);
    onDrag?.(newX, newY);
  }, [setPosition, onDrag]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.isDragging) return;
    s.isDragging = false;
    elementRef.current?.releasePointerCapture(e.pointerId);
    onDragEnd?.(s.currentX, s.currentY, e.metaKey);

    if (snapBack) {
      spring.snapTo(originX, originY, s.currentX, s.currentY, setPosition);
    }
  }, [snapBack, originX, originY, spring, setPosition, onDragEnd]);

  useEffect(() => () => spring.stop(), [spring]);

  return {
    elementRef,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp },
    isDragging: () => stateRef.current.isDragging,
    getPosition: () => ({ x: stateRef.current.currentX, y: stateRef.current.currentY }),
    setPosition,
  };
}
