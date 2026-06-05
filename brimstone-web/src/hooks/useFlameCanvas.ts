// Canvas particle system hook — mirrors the RN rAF loop.
// Draws small fillRect squares rising upward with slight drift.
"use client";

import { useRef, useEffect, useCallback } from "react";

const MAX_PARTICLES = 14;
const FLAME_CORE = "#f0a030";
const FLAME_DEAD = "#2a1510";

interface Particle {
  anim: number;     // progress 0→1
  x: number;        // horizontal drift
  size: number;
  opacity: number;
  delay: number;
  active: boolean;
}

function createParticle(): Particle {
  return {
    anim: 0,
    x: 0,
    size: 3 + Math.random() * 5,
    opacity: 0,
    delay: Math.random() * 400,
    active: false,
  };
}

export function useFlameCanvas(intensity: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pool = useRef<Particle[]>(
    Array.from({ length: MAX_PARTICLES }, createParticle),
  );
  const nextParticle = useRef(0);
  const lastEmit = useRef(0);
  const intensityRef = useRef(intensity);

  // Sync intensity ref without triggering re-renders
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  const emitParticle = useCallback(() => {
    const p = pool.current[nextParticle.current];
    nextParticle.current = (nextParticle.current + 1) % MAX_PARTICLES;
    p.anim = 0;
    p.x = 0;
    p.opacity = 0;
    p.active = true;
    p.size = 3 + Math.random() * 5;
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let lastTime = performance.now();

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const i = intensityRef.current;
      const isDead = i <= 0;

      // Clear canvas
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Emission timer
      if (!isDead) {
        lastEmit.current += dt;
        const interval = 0.3 - i * 0.2; // 0.3s at low, 0.1s at high
        if (lastEmit.current >= interval) {
          lastEmit.current = 0;
          emitParticle();
        }
      }

      // Update & draw particles
      const ch = canvas!.height;
      for (const p of pool.current) {
        if (!p.active) continue;

        p.anim += dt / (0.9 + Math.random() * 1.2); // 0.9–2.1s duration

        if (p.anim >= 1) {
          p.active = false;
          continue;
        }

        // Horizontal drift (random, once per particle life)
        if (p.x === 0) p.x = (Math.random() - 0.5) * 40;

        // Opacity: fade in then out
        const fadeIn = Math.min(p.anim / 0.15, 1); // 150ms fade in
        const fadeOut = 1 - Math.max((p.anim - 0.2) / 0.8, 0);
        p.opacity = Math.min(fadeIn, fadeOut) * 0.9;

        // Position: rise from bottom, drift horizontally
        const rise = -80 - i * 60;
        const y = ch * 0.55 + rise * p.anim;
        const x = canvas!.width / 2 + p.x;
        const scale = 1 - p.anim * 0.8; // Shrink as it rises

        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = isDead ? FLAME_DEAD : FLAME_CORE;
        ctx!.translate(x, y);
        ctx!.scale(scale, scale);
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx!.restore();
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [emitParticle]);

  return canvasRef;
}
