"use client";

import { useRef, useEffect, memo } from "react";

/* ====================================================================
   Types
   ==================================================================== */

export interface VisualizerProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  getFrequencyData: () => Uint8Array;
  getTimeDomainData: () => Uint8Array;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  // Visual
  visStyle: string;
  visColor: string;
  bgImageUrl: string | null;
  thumbImageUrl: string | null;
  // Text
  title: string;
  artist: string;
  // Overlays
  showSeekBar: boolean;
  // Particles
  showParticles: boolean;
  particleDensity: number; // 20-200
  particleSpeed: number;   // 0.5-3.0 multiplier
  particleSize: number;    // 0.5-4.0
  // Extra
  reactivity: number;
  glowLevel: number; // 0 low, 1 medium, 2 high
  rotating: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vy: number;
  size: number;
  opacity: number;
}

/* ====================================================================
   Helpers
   ==================================================================== */

function hexToRGBA(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  dx = 0,
  dy = 0
) {
  const ia = img.naturalWidth / img.naturalHeight;
  const ca = w / h;
  let sw = img.naturalWidth,
    sh = img.naturalHeight,
    sx = 0,
    sy = 0;
  if (ia > ca) {
    sw = sh * ca;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = sw / ca;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, w, h);
}

/* ====================================================================
   Standalone render function — used by both the live preview loop
   and the offline export pipeline for pixel-perfect consistency.
   ==================================================================== */

export interface RenderFrameInput {
  width: number;
  height: number;
  freqData: Uint8Array;
  visStyle: string;
  visColor: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  showSeekBar: boolean;
  showParticles: boolean;
  particleSpeed: number;
  reactivity: number;
  glowLevel: number;
  rotating: boolean;
  title: string;
  artist: string;
  bgImg: HTMLImageElement | null;
  thumbImg: HTMLImageElement | null;
}

export interface RenderFrameState {
  smoothed: Float32Array;
  particles: Particle[];
  beat: {
    rollingAvg: number;
    lastBeatTime: number;
    flashAlpha: number;
    pulseScale: number;
    glowBoost: number;
  };
}

/**
 * Renders a single visualizer frame. Completely stateless w.r.t. the React
 * component — all mutable state is passed in via `state` and mutated in-place
 * (smoothing, beat detection, particles). This allows both the live rAF loop
 * and the offline exporter to drive the exact same drawing code.
 */
export function renderVisualizerFrame(
  ctx: CanvasRenderingContext2D,
  input: RenderFrameInput,
  state: RenderFrameState,
): void {
  const { width: W, height: H } = input;
  const cx = W / 2;
  const cy = H / 2;
  const minDim = Math.min(W, H);
  const circleR = minDim * 0.22;
  const maxBarH = circleR * 0.65;
  const NUM_BARS = 180;
  const isCircular = input.visStyle !== "bars_bottom";
  const glowMul = input.glowLevel === 0 ? 0.3 : input.glowLevel === 2 ? 2.0 : 1.0;
  const time = performance.now() / 1000;

  // ── Smooth frequency data ──
  const freqData = input.freqData;
  const sm = state.smoothed;
  const usableBins = Math.min(freqData.length || 0, 420);

  if (usableBins > 0) {
    for (let i = 0; i < NUM_BARS; i++) {
      const logPos = Math.pow(i / NUM_BARS, 1.3);
      const binIdx = Math.floor(logPos * usableBins);
      const target = freqData[binIdx] || 0;
      sm[i] = sm[i] * 0.72 + target * 0.28;
    }
  } else {
    for (let i = 0; i < NUM_BARS; i++) {
      sm[i] = sm[i] * 0.95 + 2 * 0.05;
    }
  }

  // ── Beat detection ──
  const beat = state.beat;
  let bassEnergy = 0;
  if (freqData.length > 0) {
    for (let i = 0; i < 8; i++) bassEnergy += (freqData[i] || 0);
    bassEnergy /= 8;
  }

  beat.rollingAvg = beat.rollingAvg * 0.95 + bassEnergy * 0.05;
  const now = performance.now();

  if (
    bassEnergy > beat.rollingAvg * 1.45 &&
    bassEnergy > 80 &&
    now - beat.lastBeatTime > 200
  ) {
    beat.lastBeatTime = now;
    beat.flashAlpha = 0.15 + (bassEnergy / 255) * 0.18;
    beat.pulseScale = 1.06 + (bassEnergy / 255) * 0.06;
    beat.glowBoost = 25 * glowMul;
  }

  beat.flashAlpha *= 0.92;
  beat.pulseScale = 1 + (beat.pulseScale - 1) * 0.88;
  beat.glowBoost *= 0.9;
  if (beat.flashAlpha < 0.005) beat.flashAlpha = 0;

  let pulse = beat.pulseScale;
  if (!input.isPlaying && bassEnergy < 10) {
    pulse = 1 + Math.sin(time * 2) * 0.015;
  }
  const glow = beat.glowBoost;

  /* ── 1. BACKGROUND ── */
  if (input.bgImg) {
    drawCoverImage(ctx, input.bgImg, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.85);
    grad.addColorStop(0, "#141428");
    grad.addColorStop(0.5, "#0c0c1e");
    grad.addColorStop(1, "#060610");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Floating particles
  const shouldDrawParticles = input.showParticles || !input.bgImg;
  if (shouldDrawParticles) {
    const speedMul = input.particleSpeed || 1;
    for (const pt of state.particles) {
      pt.y += pt.vy * speedMul;
      if (pt.y < -0.05) {
        pt.y = 1.05;
        pt.x = Math.random();
      }
      ctx.fillStyle = `rgba(255,255,255,${pt.opacity})`;
      ctx.beginPath();
      ctx.arc(pt.x * W, pt.y * H, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Center halo
  const haloGrad = ctx.createRadialGradient(cx, cy, circleR * 0.5, cx, cy, circleR * 2.8);
  haloGrad.addColorStop(0, hexToRGBA(input.visColor, 0.05 + glow * 0.002));
  haloGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haloGrad;
  ctx.fillRect(0, 0, W, H);

  /* ── 2. VISUALIZATION ── */
  if (isCircular) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    if (input.rotating) ctx.rotate(time * 15 * (Math.PI / 180));

    const bSB = 6 * glowMul;
    const effMaxH = maxBarH * input.reactivity;

    switch (input.visStyle) {
      case "ncs_bars":
        _drawRadialBars(ctx, circleR, NUM_BARS, sm, effMaxH, input.visColor, bSB + glow * 0.3);
        break;
      case "ncs_wave":
        _drawCircleWave(ctx, circleR, NUM_BARS, sm, effMaxH * 0.8, input.visColor, 12 * glowMul + glow * 0.3);
        break;
      case "ncs_dots":
        _drawParticleRing(ctx, circleR, NUM_BARS, sm, effMaxH * 0.7, input.visColor, 8 * glowMul + glow * 0.3);
        break;
    }

    // Circle ring
    ctx.beginPath();
    ctx.arc(0, 0, circleR, 0, Math.PI * 2);
    ctx.strokeStyle = input.visColor;
    ctx.lineWidth = 3;
    ctx.shadowBlur = (25 + glow) * glowMul;
    ctx.shadowColor = input.visColor;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Thumbnail
    if (input.thumbImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, circleR - 3, 0, Math.PI * 2);
      ctx.clip();
      const sz = (circleR - 3) * 2;
      drawCoverImage(ctx, input.thumbImg, sz, sz, -sz / 2, -sz / 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, circleR - 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fill();
    }

    ctx.restore();
  } else {
    // bars_bottom
    const effMaxH = maxBarH * input.reactivity;
    _drawBottomBars(ctx, W, H, sm, NUM_BARS, effMaxH, input.visColor, 8 * glowMul + glow * 0.3);

    if (input.thumbImg) {
      const sz = minDim * 0.28;
      const ty = H * 0.18;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, ty + sz / 2, sz / 2, 0, Math.PI * 2);
      ctx.clip();
      drawCoverImage(ctx, input.thumbImg, sz, sz, cx - sz / 2, ty);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, ty + sz / 2, sz / 2, 0, Math.PI * 2);
      ctx.strokeStyle = input.visColor;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15 * glowMul;
      ctx.shadowColor = input.visColor;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  /* ── 3. BEAT FLASH ── */
  if (beat.flashAlpha > 0.005) {
    ctx.fillStyle = `rgba(255,255,255,${beat.flashAlpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── 4. TEXT OVERLAYS ── */
  if (input.title || input.artist) {
    const textX = cx;
    let textY: number;
    if (isCircular) {
      textY = cy + circleR * pulse + minDim * 0.08;
    } else {
      const thumbSz = input.thumbImg ? minDim * 0.28 : 0;
      textY = H * 0.18 + thumbSz + minDim * 0.06;
    }

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = input.visColor;

    if (input.title) {
      const fs = Math.max(Math.floor(W * 0.03), 24);
      ctx.font = `bold ${fs}px "Inter", "Segoe UI", Arial, sans-serif`;
      ctx.shadowBlur = 15 * glowMul;
      ctx.fillStyle = "white";
      ctx.fillText(input.title, textX, textY, W * 0.8);
    }
    if (input.artist) {
      const fs2 = Math.max(Math.floor(W * 0.017), 14);
      ctx.font = `500 ${fs2}px "Inter", "Segoe UI", Arial, sans-serif`;
      ctx.shadowBlur = 10 * glowMul;
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      const titleOffset = input.title ? W * 0.042 : 0;
      ctx.fillText(input.artist, textX, textY + titleOffset, W * 0.6);
    }
    ctx.restore();
  }

  /* ── 5. SEEK BAR ── */
  if (input.showSeekBar && input.duration > 0) {
    _drawSeekBar(ctx, input.currentTime, input.duration, W, H, input.visColor, glowMul);
  }
}

/* ====================================================================
   Canvas Component
   ==================================================================== */

function NCSVisualizerCanvas(props: VisualizerProps) {
  const {
    canvasRef,
    width,
    height,
  } = props;

  const propsRef = useRef(props);
  propsRef.current = props;

  // ── Mutable render state ──
  const smoothedRef = useRef<Float32Array>(new Float32Array(360));
  const particlesRef = useRef<Particle[]>([]);
  const prevSizeRef = useRef({ w: 0, h: 0 });

  // Beat detection state
  const beatRef = useRef({
    rollingAvg: 0,
    lastBeatTime: 0,
    flashAlpha: 0,
    pulseScale: 1,
    glowBoost: 0,
  });

  // Loaded images
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const thumbImgRef = useRef<HTMLImageElement | null>(null);
  const bgUrlRef = useRef<string | null>(null);
  const thumbUrlRef = useRef<string | null>(null);

  // ── Rebuild particles when density/speed/size change ──
  useEffect(() => {
    const count = props.particleDensity || 60;
    const speedMul = props.particleSpeed || 1;
    const sizeMul = props.particleSize || 1;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vy: -(0.0002 + Math.random() * 0.0005) * speedMul,
      size: (0.5 + Math.random() * 2) * sizeMul,
      opacity: 0.05 + Math.random() * 0.25,
    }));
  }, [props.particleDensity, props.particleSpeed, props.particleSize]);

  // ── Load background image ──
  useEffect(() => {
    const url = props.bgImageUrl;
    if (url === bgUrlRef.current) return;
    bgUrlRef.current = url;
    if (url) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        bgImgRef.current = img;
      };
    } else {
      bgImgRef.current = null;
    }
  }, [props.bgImageUrl]);

  // ── Load thumbnail image ──
  useEffect(() => {
    const url = props.thumbImageUrl;
    if (url === thumbUrlRef.current) return;
    thumbUrlRef.current = url;
    if (url) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        thumbImgRef.current = img;
      };
    } else {
      thumbImgRef.current = null;
    }
  }, [props.thumbImageUrl]);

  // ── Animation loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      const p = propsRef.current;
      const { width: W, height: H } = p;

      // Resize canvas only when needed
      if (prevSizeRef.current.w !== W || prevSizeRef.current.h !== H) {
        canvas.width = W;
        canvas.height = H;
        prevSizeRef.current = { w: W, h: H };
      }

      const freqData = p.getFrequencyData();

      renderVisualizerFrame(ctx, {
        width: W,
        height: H,
        freqData,
        visStyle: p.visStyle,
        visColor: p.visColor,
        isPlaying: p.isPlaying,
        currentTime: p.currentTime,
        duration: p.duration,
        showSeekBar: p.showSeekBar,
        showParticles: p.showParticles,
        particleSpeed: p.particleSpeed,
        reactivity: p.reactivity,
        glowLevel: p.glowLevel,
        rotating: p.rotating,
        title: p.title,
        artist: p.artist,
        bgImg: bgImgRef.current,
        thumbImg: thumbImgRef.current,
      }, {
        smoothed: smoothedRef.current,
        particles: particlesRef.current,
        beat: beatRef.current,
      });
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: "100%",
        maxHeight: "68vh",
        aspectRatio: `${width}/${height}`,
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}

/* ======================================================================
   DRAWING FUNCTIONS
   ====================================================================== */

function _drawRadialBars(
  ctx: CanvasRenderingContext2D,
  radius: number,
  numBars: number,
  data: Float32Array,
  maxH: number,
  color: string,
  blur: number
) {
  const step = (Math.PI * 2) / numBars;

  ctx.save();
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  // Outer bars (batched)
  ctx.beginPath();
  for (let i = 0; i < numBars; i++) {
    const angle = step * i - Math.PI / 2;
    const val = Math.min(data[i] / 255, 1);
    const barH = val * maxH;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const r1 = radius + 5;
    const r2 = r1 + barH;
    ctx.moveTo(c * r1, s * r1);
    ctx.lineTo(c * r2, s * r2);
  }
  ctx.stroke();

  // Inner bars (mirror, shorter, dimmer)
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  for (let i = 0; i < numBars; i++) {
    const angle = step * i - Math.PI / 2;
    const val = Math.min(data[i] / 255, 1);
    const barH = val * maxH * 0.25;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const r1 = radius - 5;
    const r2 = r1 - barH;
    ctx.moveTo(c * r1, s * r1);
    ctx.lineTo(c * r2, s * r2);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function _drawCircleWave(
  ctx: CanvasRenderingContext2D,
  baseR: number,
  numPts: number,
  data: Float32Array,
  maxDisp: number,
  color: string,
  blur: number
) {
  const step = (Math.PI * 2) / numPts;

  ctx.save();
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;

  // Outer wave
  ctx.beginPath();
  for (let i = 0; i <= numPts; i++) {
    const idx = i % numPts;
    const angle = step * idx - Math.PI / 2;
    const val = Math.min(data[idx] / 255, 1);
    const r = baseR + 5 + val * maxDisp;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Inner wave (mirror)
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  for (let i = 0; i <= numPts; i++) {
    const idx = i % numPts;
    const angle = step * idx - Math.PI / 2;
    const val = Math.min(data[idx] / 255, 1);
    const r = baseR - 5 - val * maxDisp * 0.25;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function _drawParticleRing(
  ctx: CanvasRenderingContext2D,
  baseR: number,
  numDots: number,
  data: Float32Array,
  maxDisp: number,
  color: string,
  blur: number
) {
  const step = (Math.PI * 2) / numDots;

  ctx.save();
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.fillStyle = color;

  for (let i = 0; i < numDots; i++) {
    const angle = step * i - Math.PI / 2;
    const val = Math.min(data[i] / 255, 1);
    const r = baseR + 5 + val * maxDisp;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const dotR = 1.5 + val * 3;

    ctx.globalAlpha = 0.35 + val * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Inner ring (static dots, subtler)
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < numDots; i += 2) {
    const angle = step * i - Math.PI / 2;
    const val = Math.min(data[i] / 255, 1);
    const r = baseR - 5 - val * maxDisp * 0.15;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function _drawBottomBars(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  data: Float32Array,
  numBars: number,
  maxH: number,
  color: string,
  blur: number
) {
  const BAR_COUNT = 80;
  const totalW = W * 0.7;
  const barW = totalW / BAR_COUNT - 2;
  const sx = (W - totalW) / 2;
  const baseY = H - 100;

  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;

  for (let i = 0; i < BAR_COUNT; i++) {
    const dIdx = Math.floor((i / BAR_COUNT) * numBars);
    const val = Math.min(data[dIdx] / 255, 1);
    const barH = val * maxH * 1.5;
    const x = sx + i * (barW + 2);

    ctx.globalAlpha = 0.55 + val * 0.45;
    ctx.fillRect(x, baseY - barH, barW, barH);

    // Reflection
    ctx.globalAlpha = 0.1 + val * 0.08;
    ctx.fillRect(x, baseY + 4, barW, barH * 0.12);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function _drawSeekBar(
  ctx: CanvasRenderingContext2D,
  cur: number,
  dur: number,
  W: number,
  H: number,
  color: string,
  glowMul: number
) {
  const barW = W * 0.5;
  const barH = 4;
  const barX = (W - barW) / 2;
  const barY = H - 38;
  const prog = Math.min(cur / dur, 1);

  // Track background
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, barH / 2);
  ctx.fill();

  // Progress
  if (prog > 0.001) {
    ctx.fillStyle = color;
    ctx.shadowBlur = 6 * glowMul;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * prog, barH, barH / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Dot
  ctx.beginPath();
  ctx.arc(barX + barW * prog, barY + barH / 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();

  // Time text
  const fs = Math.max(Math.floor(W * 0.011), 12);
  ctx.font = `500 ${fs}px "Inter", monospace, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`${fmtTime(cur)} / ${fmtTime(dur)}`, W / 2, barY + barH + 10);
}

export default memo(NCSVisualizerCanvas);
