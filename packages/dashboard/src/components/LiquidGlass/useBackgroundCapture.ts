"use client";
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import html2canvas from 'html2canvas';

// ============================================================================
// useBackgroundCapture — Unified background texture provider
//
// Two modes:
//   1. Static image: backgroundImage URL provided → loads as THREE.Texture
//   2. DOM capture: no backgroundImage → two sub-modes:
//      a. Fast path: detects a directly-drawable element behind the glass
//         (<video>, <canvas>, <img>) and uses ctx.drawImage in a rAF loop.
//         This gives ~60fps updates with near-zero CPU overhead.
//      b. Fallback: html2canvas full-DOM re-render at ~8fps for pure CSS/HTML
//         backgrounds that have no drawable source element.
//
// In html2canvas mode, elements marked with [data-liquid-glass] are hidden
// during capture so the glass effect doesn't photograph itself.
// ============================================================================

export interface WallpaperColors {
  avgColor: [number, number, number];
  lightDir: [number, number];
  lightIntensity: number;
}

export interface GLRef {
  material: THREE.ShaderMaterial;
  texture: THREE.Texture | null;
}

// --- Wallpaper color extraction ---
// Reuses a persistent tiny canvas to avoid per-call allocation.

let _colorCanvas: HTMLCanvasElement | null = null;
let _colorCtx: CanvasRenderingContext2D | null = null;
function getColorCtx() {
  if (!_colorCanvas && typeof document !== 'undefined') {
    _colorCanvas = document.createElement('canvas');
    _colorCanvas.width = 16;
    _colorCanvas.height = 16;
    _colorCtx = _colorCanvas.getContext('2d', { willReadFrequently: true })!;
  }
  return _colorCtx;
}

export function extractWallpaperColors(
  source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
): WallpaperColors {
  const sz = 16;
  const ctx = getColorCtx();
  if (!ctx) return { avgColor: [0.5, 0.5, 0.5] as [number,number,number], lightDir: [0.3, 0.5] as [number,number], lightIntensity: 0.5 };
  try {
    ctx.drawImage(source, 0, 0, sz, sz);
  } catch {
    return { avgColor: [0.5, 0.5, 0.5], lightDir: [0.3, 0.5], lightIntensity: 0.5 };
  }
  const data = ctx.getImageData(0, 0, sz, sz).data;
  let rS = 0, gS = 0, bS = 0, bL = 0, bX = 0, bY = 0;
  const n = sz * sz;
  for (let y = 0; y < sz; y++)
    for (let x = 0; x < sz; x++) {
      const i = (y * sz + x) * 4;
      const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
      rS += r; gS += g; bS += b;
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      if (l > bL) { bL = l; bX = x; bY = y; }
    }
  const dx = (bX / sz - 0.5) * 2, dy = (0.5 - bY / sz) * 2;
  const len = Math.hypot(dx, dy) || 1;
  return {
    avgColor: [rS / n, gS / n, bS / n],
    lightDir: [dx / len, dy / len] as [number, number],
    lightIntensity: bL,
  };
}

// ============================================================================
// Shared singleton state
// ============================================================================

let sharedTexture: THREE.CanvasTexture | null = null;
let sharedColors: WallpaperColors = {
  avgColor: [0.5, 0.5, 0.5],
  lightDir: [0.3, 0.5],
  lightIntensity: 0.5,
};
let captureGeneration = 0;
let subscriberCount = 0;

// html2canvas state
let captureTimer: number = 0;
let capturing = false;
const CAPTURE_INTERVAL = 120; // ms — ~8fps for fallback
const CAPTURE_SCALE = 0.35;

// Live source (drawImage) state
let liveRAF = 0;
let liveCanvas: HTMLCanvasElement | null = null;
let liveCtx: CanvasRenderingContext2D | null = null;
let liveColorFrame = 0;

// Periodic re-check for newly-available drawable sources
let sourceCheckTimer = 0;

// ============================================================================
// Fast path: direct drawImage from a background element
// ============================================================================

type DrawableSource = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement;

function detectDrawableSource(): DrawableSource | null {
  // Playing video → always prefer (covers animated/live content)
  const videos = document.querySelectorAll<HTMLVideoElement>('video');
  for (const v of videos) {
    if (!v.paused && v.readyState >= 2) return v;
  }
  // Non-glass canvas
  const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas:not([data-liquid-glass])');
  if (canvases.length > 0) return canvases[0];
  // Background-sized image (covers ≥50% of viewport in each dimension)
  const imgs = document.querySelectorAll<HTMLImageElement>('img');
  for (const img of imgs) {
    if (!img.complete || !img.naturalWidth) continue;
    const r = img.getBoundingClientRect();
    if (r.width >= window.innerWidth * 0.5 && r.height >= window.innerHeight * 0.5) return img;
  }
  return null;
}

function ensureLiveCanvas() {
  const w = Math.round(window.innerWidth * CAPTURE_SCALE);
  const h = Math.round(window.innerHeight * CAPTURE_SCALE);
  if (!liveCanvas || liveCanvas.width !== w || liveCanvas.height !== h) {
    liveCanvas = document.createElement('canvas');
    liveCanvas.width = w;
    liveCanvas.height = h;
    liveCtx = liveCanvas.getContext('2d')!;
    // Re-create texture pointing at the new canvas
    if (sharedTexture) {
      sharedTexture.dispose();
      sharedTexture = null;
    }
  }
  if (!sharedTexture) {
    sharedTexture = new THREE.CanvasTexture(liveCanvas);
    sharedTexture.minFilter = THREE.LinearFilter;
    sharedTexture.magFilter = THREE.LinearFilter;
    sharedTexture.wrapS = THREE.ClampToEdgeWrapping;
    sharedTexture.wrapT = THREE.ClampToEdgeWrapping;
  }
}

function startLiveCapture(source: DrawableSource) {
  if (liveRAF) return; // already running
  ensureLiveCanvas();

  const loop = () => {
    if (subscriberCount <= 0) { liveRAF = 0; return; }
    const w = liveCanvas!.width, h = liveCanvas!.height;

    // Resize if window changed
    const targetW = Math.round(window.innerWidth * CAPTURE_SCALE);
    const targetH = Math.round(window.innerHeight * CAPTURE_SCALE);
    if (w !== targetW || h !== targetH) {
      ensureLiveCanvas();
      // Re-apply to all materials on next color sync
    }

    try {
      liveCtx!.drawImage(source, 0, 0, liveCanvas!.width, liveCanvas!.height);
      sharedTexture!.needsUpdate = true;
      // Color extraction every 12 frames (~5fps worth at 60fps) — cheap but not free
      if (liveColorFrame++ % 12 === 0) {
        sharedColors = extractWallpaperColors(liveCanvas!);
      }
      captureGeneration++;
    } catch {
      // Source became unavailable (e.g. CORS taint) — stop and fall back
      liveRAF = 0;
      startHtml2CanvasCapture();
      return;
    }

    liveRAF = requestAnimationFrame(loop);
  };

  liveRAF = requestAnimationFrame(loop);
}

function stopLiveCapture() {
  if (liveRAF) { cancelAnimationFrame(liveRAF); liveRAF = 0; }
}

// ============================================================================
// Fallback: html2canvas full-DOM re-render
// ============================================================================

async function captureViewport() {
  if (capturing) return;
  capturing = true;

  const glassEls = document.querySelectorAll<HTMLElement>('[data-liquid-glass]');
  glassEls.forEach(el => { el.style.visibility = 'hidden'; });

  try {
    const canvas = await html2canvas(document.body, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      logging: false,
      backgroundColor: null,
      removeContainer: true,
    });

    if (!sharedTexture) {
      sharedTexture = new THREE.CanvasTexture(canvas);
      sharedTexture.minFilter = THREE.LinearFilter;
      sharedTexture.magFilter = THREE.LinearFilter;
      sharedTexture.wrapS = THREE.ClampToEdgeWrapping;
      sharedTexture.wrapT = THREE.ClampToEdgeWrapping;
    } else {
      sharedTexture.image = canvas;
      sharedTexture.needsUpdate = true;
    }

    sharedColors = extractWallpaperColors(canvas);
    captureGeneration++;
  } catch { /* silently ignore */ }

  glassEls.forEach(el => { el.style.visibility = ''; });
  capturing = false;
}

function startHtml2CanvasCapture() {
  if (captureTimer) return;
  const loop = async () => {
    if (subscriberCount <= 0) { captureTimer = 0; return; }
    // If a drawable source appeared (e.g. video started), switch to fast path
    const source = detectDrawableSource();
    if (source) {
      captureTimer = 0;
      startLiveCapture(source);
      return;
    }
    await captureViewport();
    captureTimer = window.setTimeout(loop, CAPTURE_INTERVAL);
  };
  loop();
}

function stopHtml2CanvasCapture() {
  if (captureTimer) { clearTimeout(captureTimer); captureTimer = 0; }
}

// ============================================================================
// Unified start/stop
// ============================================================================

function startCapture() {
  if (liveRAF || captureTimer) return;
  const source = detectDrawableSource();
  if (source) {
    startLiveCapture(source);
  } else {
    startHtml2CanvasCapture();
  }
  // Periodically check if a video starts playing so we can upgrade to fast path
  if (!sourceCheckTimer) {
    sourceCheckTimer = window.setInterval(() => {
      if (subscriberCount <= 0) {
        clearInterval(sourceCheckTimer); sourceCheckTimer = 0; return;
      }
      if (!liveRAF) {
        const src = detectDrawableSource();
        if (src) { stopHtml2CanvasCapture(); startLiveCapture(src); }
      }
    }, 1500);
  }
}

function stopCapture() {
  stopLiveCapture();
  stopHtml2CanvasCapture();
  if (sourceCheckTimer) { clearInterval(sourceCheckTimer); sourceCheckTimer = 0; }
}

// ============================================================================
// Apply texture + colors to a GL material
// ============================================================================

function applyToMaterial(
  gl: GLRef,
  tex: THREE.Texture,
  colors: WallpaperColors,
  ownsTexture: boolean,
) {
  if (ownsTexture && gl.texture && gl.texture !== tex) gl.texture.dispose();
  if (ownsTexture) gl.texture = tex;
  gl.material.uniforms.uBackgroundTexture.value = tex;
  gl.material.uniforms.uWallpaperTint.value.set(...colors.avgColor);
  gl.material.uniforms.uLightDir.value.set(...colors.lightDir);
  gl.material.uniforms.uLightIntensity.value = colors.lightIntensity;
}

// ============================================================================
// Hook
// ============================================================================

export function useBackgroundCapture(
  backgroundImage: string | undefined,
  glRef: React.RefObject<GLRef | null>,
  onReady?: () => void,
) {
  const appliedGenRef = useRef(-1);

  // --- Static image mode ---
  useEffect(() => {
    if (!backgroundImage) return;
    const loader = new THREE.TextureLoader();
    let cancelled = false;

    const attempt = () => {
      if (cancelled) return;
      if (!glRef.current) { requestAnimationFrame(attempt); return; }
      loader.load(backgroundImage, (tex) => {
        if (cancelled) { tex.dispose(); return; }
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        const gl = glRef.current;
        if (gl) {
          const colors = extractWallpaperColors(tex.image as HTMLImageElement);
          applyToMaterial(gl, tex, colors, true);
          onReady?.();
        }
      });
    };
    attempt();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundImage]);

  // --- DOM capture mode ---
  useEffect(() => {
    if (backgroundImage) return;

    subscriberCount++;
    startCapture();

    let cancelled = false;

    // Wait for first capture, then wire up the shared texture
    const waitAndApply = () => {
      if (cancelled) return;
      const gl = glRef.current;
      if (gl && sharedTexture) {
        applyToMaterial(gl, sharedTexture, sharedColors, false);
        appliedGenRef.current = captureGeneration;
        onReady?.();
      } else {
        requestAnimationFrame(waitAndApply);
      }
    };
    waitAndApply();

    // Sync colors + texture pointer as captures update.
    // Use rAF for the live path (color updates at ~5fps), timer for html2canvas.
    const syncInterval = setInterval(() => {
      const gl = glRef.current;
      if (!gl || !sharedTexture) return;
      if (captureGeneration === appliedGenRef.current) return;

      // Re-wire texture pointer in case it was re-created (e.g. after resize)
      if (gl.material.uniforms.uBackgroundTexture.value !== sharedTexture) {
        gl.material.uniforms.uBackgroundTexture.value = sharedTexture;
      }
      gl.material.uniforms.uWallpaperTint.value.set(...sharedColors.avgColor);
      gl.material.uniforms.uLightDir.value.set(...sharedColors.lightDir);
      gl.material.uniforms.uLightIntensity.value = sharedColors.lightIntensity;
      appliedGenRef.current = captureGeneration;
    }, 150);

    return () => {
      cancelled = true;
      clearInterval(syncInterval);
      subscriberCount--;
      if (subscriberCount <= 0) {
        stopCapture();
        subscriberCount = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundImage]);
}
