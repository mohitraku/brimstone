// 2D animated flame — angular, low-poly, PS1-era aesthetic.
// Diamond layers via CSS transforms + @keyframes, particles via Canvas.
// Ported from React Native Animated API. Pixel-identical output.
"use client";

import { useRef } from "react";
import { colors } from "@/lib/theme";
import { useFlameCanvas } from "@/hooks/useFlameCanvas";

// ── Warm palette (flat, no gradients) ────────────────────────
const FLAME_OUTER = "#8b3a0f";
const FLAME_MID = "#b8550f";
const FLAME_INNER = "#d4791a";
const FLAME_CORE = "#f0a030";
const FLAME_DEAD = "#1a1410";
const EMBER_GLOW = "#2a1008";

interface Props {
  intensity: number; // 0.0–1.0
}

export function FlameScene({ intensity }: Props) {
  const canvasRef = useFlameCanvas(intensity);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDead = intensity <= 0;

  // Flame colors based on intensity
  const outerColor = isDead ? FLAME_DEAD : FLAME_OUTER;
  const midColor = isDead ? FLAME_DEAD : FLAME_MID;
  const innerColor = isDead ? FLAME_DEAD : FLAME_INNER;
  const coreColor = isDead ? EMBER_GLOW : FLAME_CORE;

  const flameOpacity = isDead ? 0.25 : 0.7 + intensity * 0.3;
  const midFlameOpacity = isDead ? 0.15 : 0.5 + intensity * 0.4;
  const coreOpacity = isDead ? 0.04 : 0.5 + intensity * 0.5;

  // Container height — min 260px or 40% of viewport
  const containerH = "max(40dvh, 260px)";

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        height: containerH,
        minHeight: 260,
      }}
    >
      {/* ── Particles (Canvas) ───────────────────────────────── */}
      <canvas
        ref={canvasRef}
        width={360}
        height={400}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* ── Flame grouping ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          position: "relative",
        }}
      >
        {/* ── Wisps — rotating angular planes ───────────────── */}
        {!isDead && (
          <>
            <div
              style={{
                ...wispBase,
                ...wisp1,
                opacity: 0.25 + intensity * 0.3,
                animation: "wispSpin 3.2s linear infinite",
              }}
            />
            <div
              style={{
                ...wispBase,
                ...wisp2,
                opacity: 0.2 + intensity * 0.25,
                animation: "wispSpin2 2.8s linear infinite",
              }}
            />
            {intensity > 0.4 && (
              <div
                style={{
                  ...wispBase,
                  ...wisp3,
                  opacity: 0.15 + intensity * 0.2,
                  animation: "wispSpin 3.2s linear infinite",
                }}
              />
            )}
          </>
        )}

        {/* ── Outer flame (largest, darkest) ─────────────────── */}
        <div
          style={{
            ...diamondBase,
            width: 90,
            height: 90,
            backgroundColor: outerColor,
            opacity: flameOpacity,
            animation: "pulse 1.7s ease-in-out infinite, flicker 0.65s infinite",
          }}
        />

        {/* ── Mid flame ──────────────────────────────────────── */}
        <div
          style={{
            ...diamondBase,
            width: 60,
            height: 60,
            backgroundColor: midColor,
            opacity: midFlameOpacity,
            animation: "pulse 1.7s ease-in-out infinite, flicker 0.65s infinite 0.05s",
          }}
        />

        {/* ── Inner flame (smaller, hotter) ──────────────────── */}
        <div
          style={{
            ...diamondBase,
            width: 36,
            height: 36,
            backgroundColor: innerColor,
            opacity: coreOpacity,
            animation: "pulse 1.7s ease-in-out infinite 0.1s, flicker 0.65s infinite 0.1s",
          }}
        />

        {/* ── Core (brightest) ───────────────────────────────── */}
        <div
          style={{
            ...diamondBase,
            width: 18,
            height: 18,
            backgroundColor: coreColor,
            opacity: isDead ? 0.04 : 0.5 + intensity * 0.5,
            animation: "pulse 1.7s ease-in-out infinite 0.2s, flicker 0.65s infinite 0.15s",
          }}
        />
      </div>

      {/* ── Rock base ────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: 180,
          height: 40,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div style={{ ...rockBase, width: 60, height: 22, bottom: 0, transform: "rotate(3deg)" }} />
        <div style={{ ...rockBase, width: 42, height: 16, bottom: 6, left: 30, transform: "rotate(-8deg)" }} />
        <div style={{ ...rockBase, width: 42, height: 16, bottom: 6, right: 30, transform: "rotate(7deg)" }} />
        <div style={{ ...rockBase, width: 30, height: 12, bottom: 2, left: 8, transform: "rotate(-14deg)" }} />
        <div style={{ ...rockBase, width: 30, height: 12, bottom: 2, right: 8, transform: "rotate(14deg)" }} />
      </div>

      {/* ── Ember dot (dead flame) ──────────────────────────── */}
      {isDead && (
        <div
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#5a2010",
            animation: "emberPulse 1.7s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────

const diamondBase: React.CSSProperties = {
  position: "absolute",
  transform: "rotate(45deg)",
};

const rockBase: React.CSSProperties = {
  position: "absolute",
  backgroundColor: "#1a1a1a",
  border: "1px solid #222",
};

const wispBase: React.CSSProperties = {
  position: "absolute",
};

const wisp1: React.CSSProperties = {
  width: 50,
  height: 14,
  backgroundColor: FLAME_OUTER,
  top: -30,
  left: 10,
};

const wisp2: React.CSSProperties = {
  width: 40,
  height: 10,
  backgroundColor: FLAME_MID,
  top: -50,
  left: -20,
};

const wisp3: React.CSSProperties = {
  width: 34,
  height: 8,
  backgroundColor: FLAME_INNER,
  top: -40,
  left: -5,
};
