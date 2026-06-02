import { useEffect, useRef, useCallback } from "react";
import { StyleSheet, type ViewProps } from "react-native";
import { GLView } from "expo-gl";
import * as THREE from "three";

interface Props extends ViewProps {
  intensity: number; // 0.0 to 1.0
  onSceneReady?: () => void;
}

// Global renderer ref to survive re-renders
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let coreFlame: THREE.Mesh | null = null;
let wisp1: THREE.Mesh | null = null;
let wisp2: THREE.Mesh | null = null;
let pointLight: THREE.PointLight | null = null;
let animationId: number | null = null;

export function FlameScene({ intensity, onSceneReady, style }: Props) {
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const onContextCreate = useCallback(
    async (gl: WebGL2RenderingContext) => {
      // Setup Three.js renderer
      const { drawingBufferWidth: w, drawingBufferHeight: h } = gl;
      renderer = new THREE.WebGLRenderer({
        // expo-gl provides a raw GL context, not a real canvas.
        // Three.js needs addEventListener/removeEventListener on the canvas object.
        canvas: {
          width: w,
          height: h,
          style: {},
          addEventListener: () => {},
          removeEventListener: () => {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        context: gl,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);

      // Scene
      scene = new THREE.Scene();

      // Camera
      camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      camera.position.set(0, 1.5, 6);
      camera.lookAt(0, 0.8, 0);

      // Ambient light
      const ambient = new THREE.AmbientLight(0x1a0a00, 0.5);
      scene.add(ambient);

      // Point light at flame center
      pointLight = new THREE.PointLight(0xff6600, 1, 8, 2);
      pointLight.position.set(0, 1.2, 0);
      scene.add(pointLight);

      // Bonfire base (low-poly rocks)
      const baseGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.3, 8, 1);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a1a0a,
        roughness: 1,
        flatShading: true,
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.15;
      scene.add(base);

      // Second rock layer
      const rockGeo = new THREE.IcosahedronGeometry(0.35, 0);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x3a2a1a,
        roughness: 1,
        flatShading: true,
      });
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + 0.3;
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(Math.cos(angle) * 0.5, 0.2, Math.sin(angle) * 0.5);
        rock.scale.set(0.5 + Math.random() * 0.3, 0.3, 0.5 + Math.random() * 0.3);
        scene.add(rock);
      }

      // Core flame (elongated sphere)
      const flameGeo = new THREE.SphereGeometry(0.35, 8, 6);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.9,
      });
      coreFlame = new THREE.Mesh(flameGeo, flameMat);
      coreFlame.position.y = 0.7;
      coreFlame.scale.set(1, 1, 1);
      scene.add(coreFlame);

      // Inner core (white-hot)
      const innerGeo = new THREE.SphereGeometry(0.15, 6, 4);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffdd88,
        transparent: true,
        opacity: 0.8,
      });
      const innerCore = new THREE.Mesh(innerGeo, innerMat);
      coreFlame.add(innerCore);
      innerCore.position.y = -0.15;

      // Flame wisps (rotating translucent sheets)
      const wispGeo = new THREE.PlaneGeometry(0.25, 0.6);
      const wispMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });

      wisp1 = new THREE.Mesh(wispGeo, wispMat);
      wisp1.position.set(0, 0.9, 0.1);
      scene.add(wisp1);

      const wispMat2 = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      wisp2 = new THREE.Mesh(wispGeo, wispMat2);
      wisp2.position.set(0, 1.0, -0.15);
      wisp2.rotation.y = Math.PI / 3;
      scene.add(wisp2);

      // Particle system
      const particleCount = 80;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const particleColors = new Float32Array(particleCount * 3);
      particleGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      particleGeo.setAttribute(
        "color",
        new THREE.BufferAttribute(particleColors, 3)
      );
      const particleMat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.6,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      particles.position.y = 0.5;
      scene.add(particles);

      // Store particles data for animation
      const particleData: Array<{
        velocity: THREE.Vector3;
        life: number;
        maxLife: number;
      }> = [];
      for (let i = 0; i < particleCount; i++) {
        particleData.push({
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            0.5 + Math.random() * 1.5,
            (Math.random() - 0.5) * 0.3
          ),
          life: Math.random(),
          maxLife: 0.8 + Math.random() * 1.5,
        });
      }

      // Store references for animation update
      (scene as THREE.Scene & { _particles: THREE.Points })._particles =
        particles;
      (scene as THREE.Scene & { _particleData: typeof particleData })
        ._particleData = particleData;

      onSceneReady?.();

      // Animation loop
      let lastTime = performance.now();
      function animate(now: number) {
        animationId = requestAnimationFrame(animate);
        if (!renderer || !scene || !camera) return;

        const dt = (now - lastTime) / 1000;
        lastTime = now;
        const i = intensityRef.current;

        // No flame when intensity is 0
        const isAlive = i > 0;

        if (coreFlame) {
          coreFlame.visible = isAlive;
          coreFlame.scale.set(0.3 + i * 0.7, 0.3 + i * 1.2, 0.3 + i * 0.7);
          (coreFlame.material as THREE.MeshBasicMaterial).opacity = i * 0.9;
          // Color shifts warmer with intensity
          const r = 1;
          const g = 0.3 + i * 0.5;
          const b = 0.05;
          (coreFlame.material as THREE.MeshBasicMaterial).color.setRGB(r, g, b);
        }

        if (wisp1) {
          wisp1.visible = isAlive && i > 0.2;
          wisp1.rotation.z += dt * (1 + i * 2);
          wisp1.scale.set(0.5 + i * 0.5, 0.5 + i * 0.8, 1);
          (wisp1.material as THREE.MeshBasicMaterial).opacity = 0.2 + i * 0.4;
        }

        if (wisp2) {
          wisp2.visible = isAlive && i > 0.15;
          wisp2.rotation.z -= dt * (0.8 + i * 1.8);
          wisp2.rotation.y += dt * 0.5;
          wisp2.scale.set(0.4 + i * 0.6, 0.4 + i * 0.9, 1);
          (wisp2.material as THREE.MeshBasicMaterial).opacity = 0.15 + i * 0.35;
        }

        if (pointLight) {
          pointLight.intensity = i * 2;
          pointLight.color.setRGB(1, 0.3 + i * 0.5, 0.05);
        }

        // Update particles
        const pts = (scene as any)._particles as THREE.Points;
        const pdata = (scene as any)._particleData as typeof particleData;
        if (pts && pdata && isAlive) {
          pts.visible = true;
          const posArray = pts.geometry.attributes.position
            .array as Float32Array;
          const colorArray = pts.geometry.attributes.color
            .array as Float32Array;
          const emitRate = Math.floor(i * 40);

          for (let j = 0; j < particleCount; j++) {
            const pd = pdata[j];
            pd.life += dt;

            if (pd.life > pd.maxLife || posArray[j * 3 + 1] > 4) {
              // Respawn particle
              if (j < emitRate) {
                posArray[j * 3] = (Math.random() - 0.5) * 0.3;
                posArray[j * 3 + 1] = 0.4 + Math.random() * 0.3;
                posArray[j * 3 + 2] = (Math.random() - 0.5) * 0.3;
                pd.life = 0;
                pd.maxLife = 0.8 + Math.random() * 1.5;
                pd.velocity.set(
                  (Math.random() - 0.5) * 0.4,
                  0.5 + Math.random() * 2,
                  (Math.random() - 0.5) * 0.4
                );
              } else {
                // Hide offscreen
                posArray[j * 3 + 1] = -10;
              }
            } else {
              // Move particle upward
              posArray[j * 3] += pd.velocity.x * dt;
              posArray[j * 3 + 1] += pd.velocity.y * dt;
              posArray[j * 3 + 2] += pd.velocity.z * dt;
              // Fade color based on life
              const lifeRatio = pd.life / pd.maxLife;
              colorArray[j * 3] = 1;
              colorArray[j * 3 + 1] = 0.3 + (1 - lifeRatio) * 0.5;
              colorArray[j * 3 + 2] = 0.1 * (1 - lifeRatio);
            }
          }
          pts.geometry.attributes.position.needsUpdate = true;
          pts.geometry.attributes.color.needsUpdate = true;
        } else if (pts) {
          pts.visible = false;
        }

        renderer.render(scene, camera);
      }
      animationId = requestAnimationFrame(animate);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };
  }, []);

  return (
    <GLView style={[styles.glView, style]} onContextCreate={onContextCreate} />
  );
}

const styles = StyleSheet.create({
  glView: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
});
