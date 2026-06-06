// Bonfire flame engine — canvas-based Dark Souls bonfire style.
// Renders organic flame tongues, ember particles, and dead-state ember glow.
// Intensity controls animation speed, flame height, and spawn rate.
"use client";

import { useRef, useEffect } from "react";

const PARTICLE_POOL = 60;
const TONGUE_COUNT = 7;

// Flame layer colors — from outer (dark) to inner (bright)
const TONGUE_COLORS = [
  "#3a0e06", // darkest red
  "#5a1508", // deep crimson
  "#8b1a0a", // dark red-orange
  "#a83a0f", // orange-brown
  "#c46a18", // rich orange
  "#e09830", // warm gold
  "#fce070", // bright yellow-white core
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;    // 0→1
  maxLife: number;
  size: number;
  hue: number;      // 0=red → 1=yellow
}

function createParticle(): Particle {
  return {
    x: 0, y: 0, vx: 0, vy: 0, life: 1, maxLife: 0, size: 0, hue: 0,
  };
}

let _pool: Particle[] | null = null;
function getPool(): Particle[] {
  if (!_pool) _pool = Array.from({ length: PARTICLE_POOL }, createParticle);
  return _pool;
}

interface TongueParams {
  cx: number;
  baseY: number;
  flameHeight: number;
  baseWidth: number;
  tipWidth: number;
  swayLeft: number;
  swayRight: number;
  color: string;
  opacity: number;
}

function drawTongue(ctx: CanvasRenderingContext2D, p: TongueParams): void {
  const { cx, baseY, flameHeight, baseWidth, tipWidth, swayLeft, swayRight, color, opacity } = p;

  const tipY = baseY - flameHeight;
  const midY = baseY - flameHeight * 0.5;

  const leftBaseX = cx - baseWidth + swayLeft * 0.15;
  const rightBaseX = cx + baseWidth + swayRight * 0.15;
  const leftMidX = cx - baseWidth * 0.55 + swayLeft;
  const rightMidX = cx + baseWidth * 0.55 + swayRight;
  const tipX = cx + (swayLeft + swayRight) * 0.35;
  const leftTipX = tipX - tipWidth;
  const rightTipX = tipX + tipWidth;

  ctx.beginPath();
  ctx.moveTo(leftBaseX, baseY);
  ctx.quadraticCurveTo(leftMidX, midY, leftTipX, tipY);
  // Rounded tip
  ctx.quadraticCurveTo(tipX, tipY - flameHeight * 0.06, rightTipX, tipY);
  ctx.quadraticCurveTo(rightMidX, midY, rightBaseX, baseY);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.fill();

  // Faint edge highlight
  ctx.globalAlpha = opacity * 0.2;
  ctx.strokeStyle = `rgba(255,200,120,${opacity * 0.2})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function emitParticle(
  particles: Particle[],
  nextIdx: React.MutableRefObject<number>,
  cx: number,
  originY: number,
  spread: number,
): void {
  const idx = nextIdx.current % PARTICLE_POOL;
  nextIdx.current = idx + 1;
  const p = particles[idx];
  p.x = cx + (Math.random() - 0.5) * spread;
  p.y = originY;
  p.vx = (Math.random() - 0.5) * 35;
  p.vy = -(50 + Math.random() * 140);
  p.life = 0;
  p.maxLife = 0.7 + Math.random() * 1.1;
  p.size = 2 + Math.random() * 5;
  p.hue = Math.random() * 0.55;
}

export function useFlameCanvas(
  intensity: number,
): React.RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const particlesRef = useRef<Particle[]>(getPool());
  const nextIdxRef = useRef(0);
  const lastEmitRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let prev = performance.now();
    const particles = particlesRef.current;

    function tick(now: number): void {
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;
      timeRef.current += dt;

      const i = intensityRef.current;
      const speed = 0.4 + i * 1.8;
      const isDead = i <= 0;

      const w = canvas!.width;
      const h = canvas!.height;
      const cx = w / 2;
      const baseY = h * 0.8;

      ctx!.clearRect(0, 0, w, h);

      // ── Dead state ──────────────────────────────────────
      if (isDead) {
        const pulse = 0.25 + Math.sin(timeRef.current * 1.2) * 0.12;
        const glow = ctx!.createRadialGradient(cx, baseY, 0, cx, baseY, 36);
        glow.addColorStop(0, `rgba(60,18,8,${pulse})`);
        glow.addColorStop(0.5, `rgba(35,10,4,${pulse * 0.5})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = glow;
        ctx!.fillRect(cx - 50, baseY - 50, 100, 100);

        // Occasional cold ember
        if (Math.random() < 0.12) {
          emitParticle(particles, nextIdxRef, cx, baseY - 5, 20);
        }
        // Draw dead particles (cold, dim)
        for (let j = 0; j < PARTICLE_POOL; j++) {
          const p = particles[j];
          if (p.life >= 1) continue;
          p.life += dt / p.maxLife;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy -= 20 * dt;
          const alpha = Math.min(p.life / 0.12, 1) * (1 - Math.max((p.life - 0.5) / 0.5, 0)) * 0.6;
          if (alpha <= 0) continue;
          ctx!.fillStyle = `rgba(40,12,6,${alpha})`;
          ctx!.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        requestAnimationFrame(tick);
        return;
      }

      // ── Flame tongues (back to front) ───────────────────
      const flameH = h * (0.18 + i * 0.48);

      for (let t = 0; t < TONGUE_COUNT; t++) {
        const ratio = t / (TONGUE_COUNT - 1);
        const color = TONGUE_COLORS[t];
        const phase = t * 1.7;
        const amp = 11 + ratio * 16;
        const f1 = 1.3 + t * 0.4;
        const f2 = 2.1 + t * 0.3;

        const swayL =
          Math.sin(timeRef.current * f1 * speed + phase) * amp +
          Math.cos(timeRef.current * f2 * speed + phase * 2.3) * amp * 0.5;
        const swayR =
          Math.sin(timeRef.current * f1 * speed + phase + 1.8) * amp +
          Math.cos(timeRef.current * f2 * speed + phase * 1.1) * amp * 0.5;

        drawTongue(ctx!, {
          cx,
          baseY,
          flameHeight: flameH * (0.6 + ratio * 0.4),
          baseWidth: 21 - ratio * 11,
          tipWidth: 7 - ratio * 4,
          swayLeft: swayL,
          swayRight: swayR,
          color,
          opacity: 0.5 + ratio * 0.5,
        });
      }

      // ── Core glow ───────────────────────────────────────
      const glowR = flameH * 0.55;
      const glow = ctx!.createRadialGradient(
        cx, baseY - flameH * 0.25, 0,
        cx, baseY, glowR,
      );
      glow.addColorStop(0, `rgba(255,220,100,${0.25 + i * 0.45})`);
      glow.addColorStop(0.35, `rgba(220,130,40,${0.12 + i * 0.22})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(cx - glowR, baseY - flameH - glowR * 0.5, glowR * 2, flameH + glowR * 2);

      // ── Embers ──────────────────────────────────────────
      const interval = 0.26 - i * 0.16;
      if (now - lastEmitRef.current > interval * 1000) {
        lastEmitRef.current = now;
        emitParticle(particles, nextIdxRef, cx, baseY - flameH * 0.45, 45);
        if (i > 0.5) {
          emitParticle(particles, nextIdxRef, cx, baseY - flameH * 0.25, 35);
        }
      }

      for (let j = 0; j < PARTICLE_POOL; j++) {
        const p = particles[j];
        if (p.life >= 1) continue;
        p.life += dt / p.maxLife;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 25 * dt;
        p.vx *= 0.992;

        const fi = Math.min(p.life / 0.1, 1);
        const fo = p.life > 0.55 ? 1 - (p.life - 0.55) / 0.45 : 1;
        const alpha = Math.min(fi, fo) * 0.85;
        if (alpha <= 0.01) continue;

        let r: number, g: number, b: number;
        if (p.hue < 0.3) {
          const t2 = p.hue / 0.3;
          r = 180 + t2 * 60; g = 40 + t2 * 100; b = 8 + t2 * 15;
        } else {
          const t2 = (p.hue - 0.3) / 0.25;
          r = 240 + t2 * 15; g = 140 + t2 * 100; b = 23 + t2 * 60;
        }
        ctx!.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
        ctx!.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, []);

  return canvasRef;
}
