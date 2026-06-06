// Bonfire flame — canvas-rendered organic flame + CSS angular rock base.
// Dark Souls bonfire aesthetic. Canvas handles flame tongues + embers + glow.
"use client";

import { useRef } from "react";
import { colors } from "@/lib/theme";
import { useFlameCanvas } from "@/hooks/useFlameCanvas";

interface Props {
  intensity: number; // 0.0–1.0
}

export function FlameScene({ intensity }: Props) {
  const canvasRef = useFlameCanvas(intensity);
  const containerRef = useRef<HTMLDivElement>(null);

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
      {/* Full canvas — flame tongues, embers, glow, all here */}
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

      {/* Angular rock base (CSS — static, hard-edged) */}
      <div style={styles.rockContainer}>
        <div style={{ ...rockBase, width: 60, height: 22, bottom: 0, left: 60, transform: "rotate(3deg)" }} />
        <div style={{ ...rockBase, width: 42, height: 16, bottom: 6, left: 30, transform: "rotate(-8deg)" }} />
        <div style={{ ...rockBase, width: 42, height: 16, bottom: 6, right: 30, transform: "rotate(7deg)" }} />
        <div style={{ ...rockBase, width: 30, height: 12, bottom: 2, left: 8, transform: "rotate(-14deg)" }} />
        <div style={{ ...rockBase, width: 30, height: 12, bottom: 2, right: 8, transform: "rotate(14deg)" }} />
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const rockBase: React.CSSProperties = {
  position: "absolute",
  backgroundColor: "#1a1a1a",
  border: "1px solid #222",
};

const styles: Record<string, React.CSSProperties> = {
  rockContainer: {
    position: "absolute",
    bottom: 0,
    width: 180,
    height: 40,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    pointerEvents: "none",
  },
};
