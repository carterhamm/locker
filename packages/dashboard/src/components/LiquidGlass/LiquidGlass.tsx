"use client";
import React, { useRef, useEffect, useCallback, useMemo, useId } from 'react';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders';
import { useLiquidGlassContext, type ProximityInfo } from './LiquidGlassContext';
import { useDraggable } from './useDraggable';
import { useBackgroundCapture } from './useBackgroundCapture';

export interface CornerRadii {
  tl: number;  // top-left
  tr: number;  // top-right
  br: number;  // bottom-right
  bl: number;  // bottom-left
}

export interface LiquidGlassProps {
  shape?: 'rectangle' | 'circle' | 'pill';
  borderRadius?: number;
  cornerRadii?: Partial<CornerRadii>; // manual per-corner override
  thickness?: number;
  ior?: number;
  dispersion?: [number, number, number];
  opacity?: number;
  blurRadius?: number;
  aberrationIntensity?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  children?: React.ReactNode;
  backgroundImage?: string;
  onReady?: () => void;
  zIndex?: number;
  draggable?: boolean;
  snapBack?: boolean;
  morphSmoothness?: number;
  morphThreshold?: number;
  springStiffness?: number;
  springDamping?: number;
}

const MAX_PEERS = 4;

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  shape = 'rectangle',
  borderRadius = 0.06,
  cornerRadii,
  thickness = 1.0,
  ior = 1.5,
  dispersion = [0.01, 0.005, 0.015],
  opacity = 0.8,
  blurRadius = 14,
  aberrationIntensity = 1.0,
  width = 300,
  height = 200,
  className,
  style,
  ariaLabel = 'Glass effect element',
  children,
  backgroundImage,
  onReady,
  zIndex = 0,
  draggable = false,
  snapBack = false,
  morphSmoothness = 0.2,
  morphThreshold = 60,
  springStiffness = 8,
  springDamping = 0.85,
}) => {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const glRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    material: THREE.ShaderMaterial;
    mesh: THREE.Mesh;
    texture: THREE.Texture | null;
  } | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const proxRef = useRef<ProximityInfo[]>([]);
  const draggingRef = useRef(false);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastDragPosRef = useRef({ x: 0, y: 0, t: 0 });
  const hapticRef = useRef(0);
  const prevMergeStatesRef = useRef<Map<string, number>>(new Map());

  const ctx = useLiquidGlassContext();
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const numW = typeof width === 'number' ? width : 300;
  const numH = typeof height === 'number' ? height : 200;

  // Canvas padding — extra space around element for rendering morph bridges
  const padPx = morphThreshold;
  const canvasW = numW + 2 * padPx;
  const canvasH = numH + 2 * padPx;

  // Shape occupies this fraction of the padded canvas
  const shapeSizeX = numW / canvasW;
  const shapeSizeY = numH / canvasH;

  // --- Default corner radii (overridden dynamically when nested) ---
  const defaultCornerRadii = useMemo(() => {
    const base = borderRadius;
    return cornerRadii
      ? { tl: cornerRadii.tl ?? base, tr: cornerRadii.tr ?? base, br: cornerRadii.br ?? base, bl: cornerRadii.bl ?? base }
      : { tl: base, tr: base, br: base, bl: base };
  }, [borderRadius, cornerRadii]);

  // --- Cmd+drag nesting handler ---
  const handleNestDrop = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const self = ctx.getElement(id);
    if (!self) return;

    // If currently nested, check if dragged outside parent → unnest
    if (self.nestedInId) {
      const parent = ctx.getElement(self.nestedInId);
      if (parent) {
        const pL = parent.x - parent.width / 2;
        const pR = parent.x + parent.width / 2;
        const pT = parent.y - parent.height / 2;
        const pB = parent.y + parent.height / 2;
        if (cx < pL || cx > pR || cy < pT || cy > pB) {
          ctx.unnestElement(id);
          return;
        }
      }
      return; // still inside parent, keep nested
    }

    // Try to find a target element to nest into
    const allElements = ctx.getAllElements();
    for (const el of allElements) {
      if (el.id === id) continue;
      if (el.nestedInId === id) continue; // can't nest inside own child
      const eL = el.x - el.width / 2;
      const eR = el.x + el.width / 2;
      const eT = el.y - el.height / 2;
      const eB = el.y + el.height / 2;
      if (cx > eL && cx < eR && cy > eT && cy < eB) {
        ctx.nestElement(id, el.id);
        return;
      }
    }
  }, [ctx, id]);

  // --- Draggable ---

  const updateContextPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    ctx.updatePosition(id, rect.left + rect.width / 2, rect.top + rect.height / 2);
    proxRef.current = ctx.getProximityPeers(id, morphThreshold);
  }, [ctx, id, morphThreshold]);

  const { elementRef: dragRef, dragHandlers } = useDraggable({
    enabled: draggable,
    snapBack,
    springStiffness,
    springDamping,
    onDragStart: () => {
      draggingRef.current = true;
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        lastDragPosRef.current = { x: rect.left, y: rect.top, t: performance.now() };
      }
    },
    onDrag: (_x: number, _y: number) => {
      // Compute velocity for drag gleam + fling detection
      const now = performance.now();
      const dt = Math.max(now - lastDragPosRef.current.t, 1) / 1000;
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const vx = (rect.left - lastDragPosRef.current.x) / dt;
        const vy = (rect.top - lastDragPosRef.current.y) / dt;
        const sw = window.innerWidth || 1;
        // Screen-normalized for shader
        velocityRef.current = { x: vx / sw, y: vy / sw };
        // Raw px/s for context fling detection
        ctx.updateVelocity(id, vx, vy);
        lastDragPosRef.current = { x: rect.left, y: rect.top, t: now };
      }
      updateContextPosition();
    },
    onDragEnd: (_x: number, _y: number, metaKey: boolean) => {
      draggingRef.current = false;
      if (metaKey) handleNestDrop();
    },
    onPositionChange: () => updateContextPosition(),
  });

  // --- Register ---

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      ctx.register({
        id,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width, height: rect.height,
        zIndex, shape,
        originX: rect.left + rect.width / 2,
        originY: rect.top + rect.height / 2,
        avgColor: [0.5, 0.5, 0.5],
        velocityX: 0,
        velocityY: 0,
        cornerRadiusPx: borderRadius * Math.min(canvasW, canvasH),
        nestedInId: null,
      });
    });
    return () => { cancelAnimationFrame(frame); ctx.unregister(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, zIndex, shape]);

  // --- Init Three.js (once) ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio;

    const renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true, premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(canvasW, canvasH);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    const peerPositions: THREE.Vector2[] = [];
    const peerSizes: THREE.Vector2[] = [];
    const peerColors: THREE.Vector3[] = [];
    const peerOverlaps: number[] = [];
    for (let i = 0; i < MAX_PEERS; i++) {
      peerPositions.push(new THREE.Vector2(0, 0));
      peerSizes.push(new THREE.Vector2(0, 0));
      peerColors.push(new THREE.Vector3(0.5, 0.5, 0.5));
      peerOverlaps.push(0);
    }

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      uniforms: {
        uBackgroundTexture: { value: null },
        uResolution: { value: new THREE.Vector2(canvasW * dpr, canvasH * dpr) },
        uElementPosition: { value: new THREE.Vector2(0, 0) },
        uElementSize: { value: new THREE.Vector2(1, 1) },
        uThickness: { value: thickness },
        uIor: { value: ior },
        uDispersion: { value: new THREE.Vector3(...dispersion) },
        uOpacity: { value: opacity },
        uBlurRadius: { value: blurRadius },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uBorderRadius: { value: borderRadius },
        uCornerRadii: { value: new THREE.Vector4(
          defaultCornerRadii.tl, defaultCornerRadii.tr,
          defaultCornerRadii.br, defaultCornerRadii.bl,
        )},
        uShapeSize: { value: new THREE.Vector2(shapeSizeX, shapeSizeY) },
        uShapeType: { value: shape === 'circle' ? 1 : shape === 'pill' ? 2 : 0 },
        uReducedMotion: { value: prefersReducedMotion ? 1.0 : 0.0 },
        uAberrationIntensity: { value: aberrationIntensity },
        uAspect: { value: new THREE.Vector2(1.0, 1.0) },
        uPeerCount: { value: 0 },
        uPeerPositions: { value: peerPositions },
        uPeerSizes: { value: peerSizes },
        uPeerOverlaps: { value: peerOverlaps },
        uPeerColors: { value: peerColors },
        uMorphSmoothness: { value: morphSmoothness },
        uIsDragging: { value: 0 },
        uWallpaperTint: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
        uLightDir: { value: new THREE.Vector2(0.3, 0.5) },
        uLightIntensity: { value: 0.5 },
        uDragVelocity: { value: new THREE.Vector2(0, 0) },
        // Merge state per peer
        uPeerMergeStates: { value: new Array(MAX_PEERS).fill(0) },
        uPeerReleaseTimes: { value: new Array(MAX_PEERS).fill(0) },
        uPeerHoldProgress: { value: new Array(MAX_PEERS).fill(0) },
        uHapticIntensity: { value: 0 },
      },
    });

    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    glRef.current = { renderer, scene, camera, material, mesh, texture: null };

    return () => {
      cancelAnimationFrame(rafRef.current);
      geometry.dispose(); material.dispose(); renderer.dispose();
      if (glRef.current?.texture) glRef.current.texture.dispose();
      glRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBackgroundCapture(backgroundImage, glRef, onReady);

  // --- Sync props → uniforms ---

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    const u = gl.material.uniforms;
    u.uThickness.value = thickness;
    u.uIor.value = ior;
    u.uDispersion.value.set(dispersion[0], dispersion[1], dispersion[2]);
    u.uOpacity.value = opacity;
    u.uBlurRadius.value = blurRadius;
    u.uBorderRadius.value = borderRadius;
    u.uCornerRadii.value.set(
      defaultCornerRadii.tl, defaultCornerRadii.tr,
      defaultCornerRadii.br, defaultCornerRadii.bl,
    );
    u.uAberrationIntensity.value = aberrationIntensity;
    u.uShapeType.value = shape === 'circle' ? 1 : shape === 'pill' ? 2 : 0;
    u.uMorphSmoothness.value = morphSmoothness;
    u.uShapeSize.value.set(shapeSizeX, shapeSizeY);
    // Update corner radius in context for concentric computation by children
    ctx.updateCornerRadius(id, borderRadius * Math.min(canvasW, canvasH));
  }, [thickness, ior, dispersion, opacity, blurRadius, borderRadius, defaultCornerRadii,
      aberrationIntensity, shape, morphSmoothness, shapeSizeX, shapeSizeY, ctx, id, canvasW, canvasH]);

  // --- Render loop ---

  const syncAll = useCallback(() => {
    const gl = glRef.current;
    const container = containerRef.current;
    if (!gl || !container) return;

    const elRect = container.getBoundingClientRect();
    const sw = window.innerWidth;
    const sh = window.innerHeight;

    // Canvas covers padded area around the element
    const cLeft = elRect.left - padPx;
    const cTop = elRect.top - padPx;
    const cW = elRect.width + 2 * padPx;
    const cH = elRect.height + 2 * padPx;

    // Aspect for padded canvas
    const aspect = cW / Math.max(cH, 1);
    gl.material.uniforms.uAspect.value.set(
      aspect > 1 ? 1.0 : aspect,
      aspect > 1 ? 1.0 / aspect : 1.0,
    );

    // Background UV: map padded canvas to screen
    gl.material.uniforms.uElementPosition.value.set(cLeft / sw, 1.0 - (cTop + cH) / sh);
    gl.material.uniforms.uElementSize.value.set(cW / sw, cH / sh);

    gl.material.uniforms.uIsDragging.value = draggingRef.current ? 1.0 : 0.0;

    // Drag velocity — sync and decay
    const vel = velocityRef.current;
    gl.material.uniforms.uDragVelocity.value.set(vel.x, vel.y);
    if (!draggingRef.current) {
      vel.x *= 0.92;
      vel.y *= 0.92;
      if (Math.abs(vel.x) < 0.001 && Math.abs(vel.y) < 0.001) {
        vel.x = 0; vel.y = 0;
      }
      // Also decay context velocity
      ctx.updateVelocity(id, vel.x * (sw || 1), vel.y * (sh || 1));
    }

    // Morph peers — positions in padded canvas UV space + merge state
    const peers = proxRef.current;
    const u = gl.material.uniforms;
    const count = Math.min(peers.length, MAX_PEERS);
    u.uPeerCount.value = count;

    const positions = u.uPeerPositions.value as THREE.Vector2[];
    const sizes = u.uPeerSizes.value as THREE.Vector2[];
    const overlaps = u.uPeerOverlaps.value as number[];
    const colors = u.uPeerColors.value as THREE.Vector3[];
    const mergeStates = u.uPeerMergeStates.value as number[];
    const releaseTimes = u.uPeerReleaseTimes.value as number[];
    const holdProgressArr = u.uPeerHoldProgress.value as number[];

    // Detect merge state transitions for haptic
    const prevStates = prevMergeStatesRef.current;

    for (let i = 0; i < MAX_PEERS; i++) {
      if (i < count) {
        const peer = peers[i];
        const peerEl = ctx.getElement(peer.peerId);
        if (!peerEl) {
          overlaps[i] = 0; mergeStates[i] = 0;
          releaseTimes[i] = 0; holdProgressArr[i] = 0;
          continue;
        }

        // Peer center in padded canvas UV [0,1]
        positions[i].set(
          (peerEl.x - cLeft) / cW,
          1.0 - (peerEl.y - cTop) / cH,
        );
        sizes[i].set(peerEl.width / cW, peerEl.height / cH);
        overlaps[i] = peer.overlapRatio;
        colors[i].set(peer.peerColor[0], peer.peerColor[1], peer.peerColor[2]);

        // Merge state
        mergeStates[i] = peer.mergeState;
        releaseTimes[i] = peer.releaseTime;
        holdProgressArr[i] = peer.holdProgress;

        // Haptic pulse on state transitions
        const prev = prevStates.get(peer.peerId) || 0;
        if (peer.mergeState !== prev) {
          if (peer.mergeState === 1 || peer.mergeState === 2) {
            hapticRef.current = 1.0;
          }
          prevStates.set(peer.peerId, peer.mergeState);
        }
      } else {
        overlaps[i] = 0;
        mergeStates[i] = 0;
        releaseTimes[i] = 0;
        holdProgressArr[i] = 0;
      }
    }
    u.uPeerOverlaps.value = overlaps;
    u.uPeerMergeStates.value = mergeStates;
    u.uPeerReleaseTimes.value = releaseTimes;
    u.uPeerHoldProgress.value = holdProgressArr;

    // Haptic decay
    hapticRef.current *= 0.92;
    if (hapticRef.current < 0.001) hapticRef.current = 0;
    u.uHapticIntensity.value = hapticRef.current;

    // --- Dynamic concentric corners when nested ---
    const selfEl = ctx.getElement(id);
    const nestedInId = selfEl?.nestedInId;
    if (nestedInId) {
      const parentEl = ctx.getElement(nestedInId);
      if (parentEl) {
        const parentR_px = parentEl.cornerRadiusPx;

        // Parent bounding rect from context
        const pL = parentEl.x - parentEl.width / 2;
        const pT = parentEl.y - parentEl.height / 2;
        const pR = parentEl.x + parentEl.width / 2;
        const pB = parentEl.y + parentEl.height / 2;

        // Child bounding rect from DOM
        const cL = elRect.left;
        const cT = elRect.top;
        const cR = elRect.left + elRect.width;
        const cB = elRect.top + elRect.height;

        // Padding at each corner (min of horizontal + vertical distance to parent edge)
        const padTL = Math.min(cL - pL, cT - pT);
        const padTR = Math.min(pR - cR, cT - pT);
        const padBR = Math.min(pR - cR, pB - cB);
        const padBL = Math.min(cL - pL, pB - cB);

        // Concentric: inner_r = max(0, parentR - padding)
        const rTL = Math.max(0, parentR_px - Math.max(padTL, 0));
        const rTR = Math.max(0, parentR_px - Math.max(padTR, 0));
        const rBR = Math.max(0, parentR_px - Math.max(padBR, 0));
        const rBL = Math.max(0, parentR_px - Math.max(padBL, 0));

        // Convert px → normalized (uCornerRadii * min(canvasW, canvasH) = px)
        const childCanvasMin = Math.min(cW, cH);
        u.uCornerRadii.value.set(
          rTL / childCanvasMin,
          rTR / childCanvasMin,
          rBR / childCanvasMin,
          rBL / childCanvasMin,
        );
      }
    }
  }, [ctx, id, padPx]);

  useEffect(() => {
    const loop = () => {
      const gl = glRef.current;
      if (gl) {
        gl.material.uniforms.uTime.value = performance.now() * 0.001;
        gl.material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
        syncAll();
        gl.renderer.render(gl.scene, gl.camera);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [syncAll]);

  // --- Events ---

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      const c = containerRef.current;
      if (!c) return;
      const r = c.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - r.left + padPx) / canvasW,
        y: 1.0 - (e.clientY - r.top + padPx) / canvasH,
      };
    };
    const onResize = () => {
      const gl = glRef.current;
      if (!gl) return;
      const dpr = window.devicePixelRatio;
      gl.renderer.setSize(canvasW, canvasH);
      gl.material.uniforms.uResolution.value.set(canvasW * dpr, canvasH * dpr);
      updateContextPosition();
    };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('mousemove', onMouse); window.removeEventListener('resize', onResize); };
  }, [canvasW, canvasH, padPx, updateContextPosition]);

  // Proximity polling
  useEffect(() => {
    const iv = setInterval(() => {
      proxRef.current = ctx.getProximityPeers(id, morphThreshold);
    }, 33);
    return () => clearInterval(iv);
  }, [ctx, id, morphThreshold]);

  return (
    <div
      ref={(node) => {
        (dragRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={{
        display: 'inline-block',
        zIndex: zIndex + (draggingRef.current ? 100 : 0),
        cursor: draggable ? 'grab' : 'default',
        touchAction: 'none',
        userSelect: 'none',
        willChange: draggable ? 'transform' : undefined,
      }}
      {...(draggable ? dragHandlers : {})}
    >
      <div
        ref={containerRef}
        className={className}
        role="presentation"
        aria-label={ariaLabel}
        style={{
          position: 'relative',
          width: `${numW}px`,
          height: `${numH}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
          ...style,
        }}
      >
        <canvas
          ref={canvasRef}
          data-liquid-glass
          style={{
            position: 'absolute',
            top: `-${padPx}px`,
            left: `-${padPx}px`,
            width: `${canvasW}px`,
            height: `${canvasH}px`,
            pointerEvents: 'none',
            transform: 'translateZ(0)',
          }}
          aria-hidden="true"
        />
        <div style={{ position: 'relative', zIndex: 1, pointerEvents: draggable ? 'none' : 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default LiquidGlass;
