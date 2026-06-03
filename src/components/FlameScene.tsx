// PS1-era retro 3D flame — flat shading, low-poly geometry, dither aesthetic.
// Inspired by FlyKnight and Kingsfield.
import { useRef, useCallback, useEffect } from "react";
import { StyleSheet } from "react-native";
import { GLView } from "expo-gl";
import * as THREE from "three";

interface Props {
  intensity: number; // 0.0 to 1.0
}

// Module-level refs survive React re-renders
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let coreFlame: THREE.Mesh | null = null;
let innerCore: THREE.Mesh | null = null;
let wisp1: THREE.Mesh | null = null;
let wisp2: THREE.Mesh | null = null;
let wisp3: THREE.Mesh | null = null;
let pointLight: THREE.PointLight | null = null;
let particles: THREE.Points | null = null;
let animationId: number | null = null;
let lastFrameTime = 0;
let frameAccum = 0;

// Particle state (module-level for animation loop access)
interface ParticleData {
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}
const particleData: ParticleData[] = [];
const PARTICLE_COUNT = 20; // Chunky, sparse — not 80 tiny ones

// Pseudo-random but deterministic "jitter" for retro feel
const jitterOffsets: number[] = Array.from({ length: 20 }, (_, i) =>
  Math.sin(i * 1.7) * 0.03,
);

export function FlameScene({ intensity }: Props) {
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const onContextCreate = useCallback(async (gl: WebGL2RenderingContext) => {
    const { drawingBufferWidth: w, drawingBufferHeight: h } = gl;

    // Fake canvas object for Three.js — expo-gl provides raw GL, not a canvas
    const fakeCanvas = {
      width: w,
      height: h,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    renderer = new THREE.WebGLRenderer({
      canvas: fakeCanvas,
      context: gl,
      antialias: false, // Pixelated edges for retro feel
      alpha: true,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(1); // No retina — chunky pixels
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 1.5, 6);
    camera.lookAt(0, 0.8, 0);

    // ── Lighting ──────────────────────────────────────────────
    // Ambient — warm, dim
    const ambient = new THREE.AmbientLight(0x1a0800, 0.4);
    scene.add(ambient);

    // Point light — sharp cutoff, not smooth falloff
    pointLight = new THREE.PointLight(0xff5500, 1, 6, 1);
    pointLight.position.set(0, 1.2, 0);
    scene.add(pointLight);

    // ── Bonfire base (chunky low-poly rocks) ──────────────────
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.3, 6, 1);
    const baseMat = new THREE.MeshPhongMaterial({
      color: 0x2a1a0a,
      flatShading: true,
      specular: 0x000000,
      shininess: 0,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.15;
    scene.add(base);

    // Random rock chunks around the base
    const rockGeo = new THREE.IcosahedronGeometry(0.3, 0); // detail=0 — chunky
    const rockMat = new THREE.MeshPhongMaterial({
      color: 0x3a2a1a,
      flatShading: true,
      specular: 0x000000,
      shininess: 0,
    });
    const rockPositions = [
      [0.5, 0.08, 0.2],
      [-0.4, 0.1, -0.3],
      [0.1, 0.12, -0.55],
      [-0.55, 0.06, 0.15],
      [0.3, 0.05, 0.5],
    ];
    for (const [rx, ry, rz] of rockPositions) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rx, ry, rz);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rock.scale.setScalar(0.6 + Math.random() * 0.8);
      scene.add(rock);
    }

    // ── Flame core — faceted octahedron, not smooth sphere ────
    const coreGeo = new THREE.OctahedronGeometry(0.35, 0); // detail=0 — 8 triangular faces
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xdd5500,
      emissive: 0x441100,
      flatShading: true,
      specular: 0x000000,
      shininess: 0,
      transparent: true,
      opacity: 0.9,
    });
    coreFlame = new THREE.Mesh(coreGeo, coreMat);
    coreFlame.position.y = 1.2;
    coreFlame.scale.set(1, 1.6, 1); // Elongated vertically
    scene.add(coreFlame);

    // Inner white-hot core — smaller octahedron
    const innerGeo = new THREE.OctahedronGeometry(0.15, 0);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0xffcc88,
      emissive: 0x553300,
      flatShading: true,
      specular: 0x000000,
      shininess: 0,
    });
    innerCore = new THREE.Mesh(innerGeo, innerMat);
    innerCore.position.y = 1.2;
    innerCore.scale.set(1, 1.6, 1);
    scene.add(innerCore);

    // ── Flame wisps — triangular planes that rotate ────────────
    const wispGeo = new THREE.PlaneGeometry(0.5, 1.4, 1, 3);
    const wispMat = new THREE.MeshPhongMaterial({
      color: 0xdd6600,
      emissive: 0x331100,
      flatShading: true,
      specular: 0x000000,
      shininess: 0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });

    wisp1 = new THREE.Mesh(wispGeo, wispMat);
    wisp1.position.set(0, 1.2, 0);
    scene.add(wisp1);

    wisp2 = new THREE.Mesh(wispGeo.clone(), wispMat);
    wisp2.position.set(0, 1.2, 0);
    wisp2.rotation.y = Math.PI / 3;
    scene.add(wisp2);

    wisp3 = new THREE.Mesh(wispGeo.clone(), wispMat);
    wisp3.position.set(0, 1.2, 0);
    wisp3.rotation.y = (Math.PI * 2) / 3;
    scene.add(wisp3);

    // ── Chunky square particles ────────────────────────────────
    const particleGeo = new THREE.PlaneGeometry(0.06, 0.06);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });

    const particleMeshes: THREE.InstancedMesh | null = null;
    // Use individual meshes for simplicity with varying opacities
    const particleGroup = new THREE.Group();
    const particleMeshesArr: THREE.Mesh[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const mesh = new THREE.Mesh(particleGeo, particleMat.clone());
      mesh.visible = false;
      particleGroup.add(mesh);
      particleMeshesArr.push(mesh);
      particleData.push({
        velocity: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 0,
      });
    }
    scene.add(particleGroup);
    particles = particleGroup as unknown as THREE.Points;

    // Store meshes array on the group for animation access
    (particleGroup as any).__meshes = particleMeshesArr;

    // ── Animation loop ─────────────────────────────────────────
    lastFrameTime = performance.now();
    frameAccum = 0;

    function animate() {
      animationId = requestAnimationFrame(animate);

      const now = performance.now();
      const rawDt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      // Retro jitter: irregular frame timing
      frameAccum += rawDt;
      const dt = Math.min(rawDt, 0.1);
      const intensity = intensityRef.current;

      if (!scene || !renderer || !camera) return;

      if (intensity <= 0) {
        // Dead flame — hide everything, just show cold rocks
        if (coreFlame) coreFlame.scale.set(0.01, 0.01, 0.01);
        if (innerCore) innerCore.scale.set(0.01, 0.01, 0.01);
        if (pointLight) pointLight.intensity = 0;
        if (wisp1) wisp1.material.opacity = 0;
        if (wisp2) wisp2.material.opacity = 0;
        if (wisp3) wisp3.material.opacity = 0;
      } else {
        // ── Core flame ──────────────────────────────────────────
        const coreScale = 0.4 + intensity * 0.8;
        const jitter = Math.sin(frameAccum * 8) * 0.05 * intensity;
        if (coreFlame) {
          coreFlame.scale.set(coreScale + jitter, coreScale * 1.6 + jitter, coreScale + jitter);
          // Color shifts warmer with intensity
          const r = 0.8 + intensity * 0.2;
          const g = 0.25 + intensity * 0.25;
          const b = 0.05 + intensity * 0.05;
          (coreFlame.material as THREE.MeshPhongMaterial).color.setRGB(r, g, b);
          (coreFlame.material as THREE.MeshPhongMaterial).emissive?.setRGB(
            r * 0.3,
            g * 0.15,
            0,
          );
        }

        if (innerCore) {
          const innerScale = 0.15 + intensity * 0.15;
          innerCore.scale.set(innerScale, innerScale * 1.6, innerScale);
          (innerCore.material as THREE.MeshPhongMaterial).color.setRGB(
            0.9,
            0.7 + intensity * 0.3,
            0.4 + intensity * 0.3,
          );
        }

        // ── Point light ─────────────────────────────────────────
        if (pointLight) {
          pointLight.intensity = 0.3 + intensity * 1.2;
          // Hard cutoff: reduce distance at low intensity
          pointLight.distance = 3 + intensity * 4;
          // Color shift
          const lr = 0.8 + intensity * 0.2;
          const lg = 0.3 + intensity * 0.3;
          const lb = 0.05 + intensity * 0.1;
          pointLight.color.setRGB(lr, lg, lb);
        }

        // ── Wisps ───────────────────────────────────────────────
        const wispSpeed = 1.5 + intensity * 3;
        if (wisp1) {
          wisp1.rotation.z += dt * wispSpeed;
          wisp1.rotation.x += dt * wispSpeed * 0.7;
          (wisp1.material as THREE.MeshPhongMaterial).opacity = 0.3 * intensity;
          const ws = 0.6 + intensity * 0.6;
          wisp1.scale.set(ws, ws * 1.5, ws);
        }
        if (wisp2) {
          wisp2.rotation.z -= dt * wispSpeed * 0.8;
          wisp2.rotation.x += dt * wispSpeed * 0.5;
          (wisp2.material as THREE.MeshPhongMaterial).opacity = 0.25 * intensity;
          const ws = 0.5 + intensity * 0.5;
          wisp2.scale.set(ws, ws * 1.5, ws);
        }
        if (wisp3) {
          wisp3.rotation.z += dt * wispSpeed * 0.6;
          wisp3.rotation.x -= dt * wispSpeed * 0.9;
          (wisp3.material as THREE.MeshPhongMaterial).opacity = 0.2 * intensity;
          const ws = 0.45 + intensity * 0.45;
          wisp3.scale.set(ws, ws * 1.5, ws);
        }
      }

      // ── Particles ─────────────────────────────────────────────
      const meshes = (particleGroup as any).__meshes as THREE.Mesh[];
      if (meshes) {
        for (let i = 0; i < meshes.length; i++) {
          const mesh = meshes[i];
          const data = particleData[i];

          if (intensity <= 0) {
            mesh.visible = false;
            data.life = 0;
            continue;
          }

          data.life -= dt;

          if (data.life <= 0) {
            // Respawn particle
            const emissionRate = intensity * 8; // Particles per second
            if (Math.random() < emissionRate * dt * 3) {
              data.life = 0.6 + Math.random() * 1.2;
              data.maxLife = data.life;
              data.velocity.set(
                (Math.random() - 0.5) * 0.6,
                0.8 + Math.random() * 1.4,
                (Math.random() - 0.5) * 0.6,
              );
              mesh.position.set(
                (Math.random() - 0.5) * 0.3,
                0.6 + Math.random() * 0.4,
                (Math.random() - 0.5) * 0.3,
              );
              mesh.visible = true;
            } else {
              mesh.visible = false;
              continue;
            }
          }

          // Update position
          mesh.position.x += data.velocity.x * dt;
          mesh.position.y += data.velocity.y * dt;
          mesh.position.z += data.velocity.z * dt;

          // Fade with life
          const lifeRatio = data.life / data.maxLife;
          (mesh.material as THREE.MeshBasicMaterial).opacity =
            lifeRatio * 0.6 * intensity;

          // Slight horizontal drift
          data.velocity.x += ((Math.random() - 0.5) * 1.5) * dt;
          data.velocity.y += 0.3 * dt; // Accelerate upward
        }
      }

      renderer.render(scene, camera);
    }

    animate();
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };
  }, []);

  return <GLView style={styles.glView} onContextCreate={onContextCreate} />;
}

const styles = StyleSheet.create({
  glView: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
});
