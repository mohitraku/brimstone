// 2D animated flame — angular, low-poly feel. No 3D, no native modules.
// Test instantly in Expo Go — just scan the QR.
import { useRef, useEffect, useCallback } from "react";
import {
  View,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { colors } from "./theme";

interface Props {
  intensity: number; // 0.0–1.0
}

// ── Warm palette (flat, no gradients — PS1-era aesthetic) ────
const FLAME_OUTER = "#8b3a0f";  // deep orange
const FLAME_MID = "#b8550f";    // rich orange
const FLAME_INNER = "#d4791a";  // warm amber
const FLAME_CORE = "#f0a030";   // bright gold
const FLAME_DEAD = "#1a1410";   // cold ember
const EMBER_GLOW = "#2a1008";   // faint ember glow

// ── Particle pool ─────────────────────────────────────────────
const MAX_PARTICLES = 14;

interface ParticleState {
  anim: Animated.Value;   // progress 0→1
  x: Animated.Value;      // horizontal drift
  size: number;
  opacity: Animated.Value;
  delay: number;
  active: boolean;
}

function createParticle(): ParticleState {
  return {
    anim: new Animated.Value(0),
    x: new Animated.Value(0),
    size: 3 + Math.random() * 5,
    opacity: new Animated.Value(0),
    delay: Math.random() * 400,
    active: false,
  };
}

// ── Component ─────────────────────────────────────────────────
export function FlameScene({ intensity }: Props) {
  const { width: winW, height: winH } = useWindowDimensions();

  // ── Continuous animation values ──────────────────────────
  const pulse = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(0)).current;
  const wispSpin = useRef(new Animated.Value(0)).current;
  const wispSpin2 = useRef(new Animated.Value(0)).current;

  // ── Particle pool ────────────────────────────────────────
  const pool = useRef<ParticleState[]>(
    Array.from({ length: MAX_PARTICLES }, createParticle),
  );
  const nextParticle = useRef(0);
  const lastEmit = useRef(0);

  // ── Start continuous loops ───────────────────────────────
  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];

    // Pulse loop: slow rhythmic breathing
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1, duration: 900, useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0, duration: 800, useNativeDriver: true,
          }),
        ]),
      ),
    );

    // Flicker loop: rapid chaotic flicker
    loops.push(
      Animated.loop(
        Animated.sequence([
          Animated.timing(flicker, {
            toValue: 1, duration: 80, useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 0.4, duration: 130, useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 0.9, duration: 60, useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 0.3, duration: 180, useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 1, duration: 110, useNativeDriver: true,
          }),
          Animated.timing(flicker, {
            toValue: 0.5, duration: 90, useNativeDriver: true,
          }),
        ]),
      ),
    );

    // Wisp rotation loops
    loops.push(
      Animated.loop(
        Animated.timing(wispSpin, {
          toValue: 1, duration: 3200, useNativeDriver: true,
        }),
      ),
    );
    loops.push(
      Animated.loop(
        Animated.timing(wispSpin2, {
          toValue: 1, duration: 2800, useNativeDriver: false, // float rotation
        }),
      ),
    );

    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [pulse, flicker, wispSpin, wispSpin2]);

  // ── Emit a particle ──────────────────────────────────────
  const emitParticle = useCallback(() => {
    const p = pool.current[nextParticle.current];
    nextParticle.current = (nextParticle.current + 1) % MAX_PARTICLES;

    // Reset values
    p.anim.setValue(0);
    p.x.setValue(0);
    p.opacity.setValue(0);
    p.active = true;

    // Horizontal drift
    const drift = (Math.random() - 0.5) * 40;

    // Rise & fade
    Animated.parallel([
      Animated.timing(p.anim, {
        toValue: 1,
        duration: 900 + Math.random() * 1200,
        useNativeDriver: true,
      }),
      Animated.timing(p.x, {
        toValue: drift,
        duration: 900 + Math.random() * 1200,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(p.opacity, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => { p.active = false; });
  }, []);

  // ── Particle emission timer ──────────────────────────────
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    let raf: number;
    let lastTime = performance.now();

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const i = intensityRef.current;
      if (i <= 0) return; // no particles when dead

      lastEmit.current += dt;
      const interval = 0.3 - i * 0.2; // 0.3s at low, 0.1s at high
      if (lastEmit.current >= interval) {
        lastEmit.current = 0;
        emitParticle();
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [emitParticle]);

  // ── Derived animated values ──────────────────────────────
  const isDead = intensity <= 0;

  // Flame scale: pulse * intensity factor
  const flameScale = Animated.multiply(
    pulse.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.88, 1.0, 0.93],
    }),
    isDead ? 0.3 : 0.7 + intensity * 0.5,
  );

  // Flicker intensity
  const flickerScale = flicker.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.94, 1.0, 0.96],
  });

  // Wisp rotation → radians
  const wispRotate = wispSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const wispRotate2 = wispSpin2.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  // ── Flame colors based on intensity ──────────────────────
  const outerColor = isDead ? FLAME_DEAD : FLAME_OUTER;
  const midColor = isDead ? FLAME_DEAD : FLAME_MID;
  const innerColor = isDead ? FLAME_DEAD : FLAME_INNER;
  const coreColor = isDead ? EMBER_GLOW : FLAME_CORE;

  const flameOpacity = isDead ? 0.25 : 0.7 + intensity * 0.3;
  const coreOpacity = isDead ? 0.08 : 0.4 + intensity * 0.6;

  // Container height — fill available space
  const containerH = Math.max(winH * 0.4, 260);

  return (
    <View style={[styles.container, { height: containerH }]}>
      {/* ── Particles ──────────────────────────────────────── */}
      {pool.current.map((p, idx) => (
        <Animated.View
          key={idx}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              backgroundColor: isDead ? "#2a1510" : FLAME_CORE,
              opacity: p.opacity,
              transform: [
                { translateY: Animated.multiply(p.anim, -80 - intensity * 60) },
                { translateX: p.x },
                {
                  scale: p.anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0.7, 0.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* ── Flame grouping ─────────────────────────────────── */}
      <View style={styles.flameWrap}>
        {/* ── Wisps — rotating angular planes ──────────────── */}
        {!isDead && (
          <>
            <Animated.View
              style={[
                styles.wisp1,
                {
                  opacity: 0.25 + intensity * 0.3,
                  transform: [{ rotate: wispRotate }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.wisp2,
                {
                  opacity: 0.2 + intensity * 0.25,
                  transform: [{ rotate: wispRotate2 }],
                },
              ]}
            />
            {intensity > 0.4 && (
              <Animated.View
                style={[
                  styles.wisp3,
                  {
                    opacity: 0.15 + intensity * 0.2,
                    transform: [{ rotate: wispRotate }],
                  },
                ]}
              />
            )}
          </>
        )}

        {/* ── Outer flame (largest, darkest) ───────────────── */}
        <Animated.View
          style={[
            styles.flameDiamond,
            styles.flameOuter,
            {
              backgroundColor: outerColor,
              opacity: flameOpacity,
              transform: [
                { scale: Animated.multiply(flameScale, flickerScale) },
              ],
            },
          ]}
        />

        {/* ── Mid flame ────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.flameDiamond,
            styles.flameMid,
            {
              backgroundColor: midColor,
              opacity: isDead ? 0.15 : 0.5 + intensity * 0.4,
              transform: [
                {
                  scale: Animated.multiply(
                    flameScale,
                    flicker.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.92, 0.98, 1.0],
                    }),
                  ),
                },
              ],
            },
          ]}
        />

        {/* ── Inner flame (smaller, hotter) ────────────────── */}
        <Animated.View
          style={[
            styles.flameDiamond,
            styles.flameInner,
            {
              backgroundColor: innerColor,
              opacity: coreOpacity,
              transform: [
                {
                  scale: Animated.multiply(
                    pulse.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.82, 0.94, 0.88],
                    }),
                    flickerScale,
                  ),
                },
              ],
            },
          ]}
        />

        {/* ── Core (brightest) ─────────────────────────────── */}
        <Animated.View
          style={[
            styles.flameDiamond,
            styles.flameCore,
            {
              backgroundColor: coreColor,
              opacity: isDead ? 0.04 : 0.5 + intensity * 0.5,
              transform: [
                {
                  scale: Animated.multiply(
                    flicker.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.75, 0.95, 0.85],
                    }),
                    0.6 + intensity * 0.4,
                  ),
                },
              ],
            },
          ]}
        />
      </View>

      {/* ── Rock base ──────────────────────────────────────── */}
      <View style={styles.rockWrap}>
        {/* Center rock */}
        <View style={[styles.rock, styles.rockCenter]} />
        {/* Side rocks */}
        <View style={[styles.rock, styles.rockLeft]} />
        <View style={[styles.rock, styles.rockRight]} />
        <View style={[styles.rock, styles.rockFarLeft]} />
        <View style={[styles.rock, styles.rockFarRight]} />
      </View>

      {/* ── Ember fallback (dead flame) ────────────────────── */}
      {isDead && (
        <Animated.View
          style={[
            styles.emberDot,
            {
              opacity: flicker.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.7, 0.4],
              }),
            },
          ]}
        />
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  // ── Particles ───────────────────────────────────────────
  particle: {
    position: "absolute",
    bottom: "45%",
    alignSelf: "center",
  },

  // ── Flame grouping ──────────────────────────────────────
  flameWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  // Base diamond shape — rotated square
  flameDiamond: {
    position: "absolute",
    width: 80,
    height: 80,
    transform: [{ rotate: "45deg" }],
  },

  flameOuter: {
    width: 90,
    height: 90,
  },
  flameMid: {
    width: 60,
    height: 60,
  },
  flameInner: {
    width: 36,
    height: 36,
  },
  flameCore: {
    width: 18,
    height: 18,
  },

  // ── Wisps ───────────────────────────────────────────────
  wisp1: {
    position: "absolute",
    width: 50,
    height: 14,
    backgroundColor: FLAME_OUTER,
    top: -30,
    left: 10,
  },
  wisp2: {
    position: "absolute",
    width: 40,
    height: 10,
    backgroundColor: FLAME_MID,
    top: -50,
    left: -20,
  },
  wisp3: {
    position: "absolute",
    width: 34,
    height: 8,
    backgroundColor: FLAME_INNER,
    top: -40,
    left: -5,
  },

  // ── Ember dot (dead) ────────────────────────────────────
  emberDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#5a2010",
  },

  // ── Rock base ───────────────────────────────────────────
  rockWrap: {
    position: "absolute",
    bottom: 0,
    width: 180,
    height: 40,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  rock: {
    position: "absolute",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#222",
  },
  rockCenter: {
    width: 60,
    height: 22,
    bottom: 0,
    transform: [{ rotate: "3deg" }],
  },
  rockLeft: {
    width: 42,
    height: 16,
    bottom: 6,
    left: 30,
    transform: [{ rotate: "-8deg" }],
  },
  rockRight: {
    width: 42,
    height: 16,
    bottom: 6,
    right: 30,
    transform: [{ rotate: "7deg" }],
  },
  rockFarLeft: {
    width: 30,
    height: 12,
    bottom: 2,
    left: 8,
    transform: [{ rotate: "-14deg" }],
  },
  rockFarRight: {
    width: 30,
    height: 12,
    bottom: 2,
    right: 8,
    transform: [{ rotate: "14deg" }],
  },
});
