// PS1-era retro 3D flame — flat shading, faceted geometry, chunky particles.
// Inspired by FlyKnight / Kingsfield. No smooth normals, no bloom.
import { useCallback, useRef } from "react";
import { GLView } from "expo-gl";
import * as THREE from "three";

interface Props {
  intensity: number; // 0.0–1.0, drives scale, color, particle rate
}

export function FlameScene({ intensity }: Props) {
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const onContextCreate = useCallback(async (gl: WebGLRenderingContext) => {
    // ── Fake canvas for Three.js compat ──────────────────────
    const glCtx = gl as unknown as WebGL2RenderingContext;
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;

    const canvas = {
      width: w,
      height: h,
      style: {},
      clientWidth: w,
      clientHeight: h,
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => glCtx,
    } as unknown as HTMLCanvasElement;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      context: glCtx,
      antialias: false,
      alpha: true,
    });
    renderer.setPixelRatio(1); // low-res retro
    renderer.setSize(w, h);

    // ── Scene & Camera ───────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 4, 12);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50);
    camera.position.set(0, 1.6, 4.5);
    camera.lookAt(0, 0.6, 0);

    // ── Lighting ─────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x2a1508, 0.4));

    const pointLight = new THREE.PointLight(0xff6600, 2.5, 8, 1.5);
    pointLight.position.set(0, 1.2, 0.8);
    scene.add(pointLight);

    // ── Rock base ────────────────────────────────────────────
    const baseGeom = new THREE.CylinderGeometry(0.5, 0.6, 0.25, 6);
    const baseMat = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a,
      flatShading: true,
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -0.15;
    scene.add(base);

    // Chunky rocks around the base
    const rocks: THREE.Mesh[] = [];
    const rockGeom = new THREE.IcosahedronGeometry(0.2, 0);
    const rockMat = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      flatShading: true,
    });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const rock = new THREE.Mesh(rockGeom, rockMat);
      rock.position.set(Math.cos(angle) * 0.55, -0.05, Math.sin(angle) * 0.55);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.setScalar(0.7 + Math.random() * 0.5);
      scene.add(rock);
      rocks.push(rock);
    }

    // ── Flame core — faceted octahedron ──────────────────────
    const coreGeom = new THREE.OctahedronGeometry(0.3, 0);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xff8800,
      emissive: 0xcc4400,
      emissiveIntensity: 0.6,
      flatShading: true,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    core.position.y = 0.7;
    core.scale.set(1, 1.6, 1); // elongated
    scene.add(core);

    // Inner core — smaller, hotter
    const innerGeom = new THREE.OctahedronGeometry(0.12, 0);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0xffcc44,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8,
      flatShading: true,
    });
    const innerCore = new THREE.Mesh(innerGeom, innerMat);
    innerCore.position.y = 0.65;
    innerCore.scale.set(1, 1.4, 1);
    scene.add(innerCore);

    // ── Wisps — rotating triangular planes ───────────────────
    const wispGeom = new THREE.PlaneGeometry(0.4, 1.2, 1, 3);
    const wisps: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const wispMat = new THREE.MeshPhongMaterial({
        color: 0xff6600,
        emissive: 0x882200,
        emissiveIntensity: 0.4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        flatShading: true,
      });
      const wisp = new THREE.Mesh(wispGeom, wispMat);
      wisp.position.y = 0.7 + i * 0.2;
      wisp.position.x = (i - 1) * 0.25;
      scene.add(wisp);
      wisps.push(wisp);
    }

    // ── Chunky square particles ──────────────────────────────
    const MAX_PARTICLES = 20;
    const particles: {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      life: number;
      maxLife: number;
    }[] = [];

    const particleGeom = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const particleMat = new THREE.MeshPhongMaterial({
      color: 0xffaa44,
      emissive: 0xff6600,
      emissiveIntensity: 0.7,
      flatShading: true,
    });

    function spawnParticle(): void {
      if (particles.length >= MAX_PARTICLES) {
        // Recycle oldest
        const old = particles.shift()!;
        scene.remove(old.mesh);
        old.mesh.geometry.dispose();
        (old.mesh.material as THREE.Material).dispose();
      }

      const mesh = new THREE.Mesh(particleGeom, particleMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.05 + Math.random() * 0.2;
      mesh.position.set(
        Math.cos(angle) * radius,
        0.3 + Math.random() * 0.8,
        Math.sin(angle) * radius,
      );
      mesh.scale.setScalar(0.5 + Math.random() * 1);
      scene.add(mesh);

      particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          0.3 + Math.random() * 0.8,
          (Math.random() - 0.5) * 0.3,
        ),
        life: 0,
        maxLife: 0.5 + Math.random() * 1.5,
      });
    }

    // ── Animation loop ───────────────────────────────────────
    let frame = 0;
    let timeSinceLastParticle = 0;
    let animId = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      frame++;

      const i = intensityRef.current;
      const isDead = i <= 0;
      const t = performance.now() * 0.001;
      const dt = Math.min(0.1, 1 / 30); // capped at ~30fps for retro feel

      // ── Core animation ─────────────────────────────────
      if (isDead) {
        core.visible = false;
        innerCore.visible = false;
        pointLight.intensity = 0;
      } else {
        core.visible = true;
        innerCore.visible = true;

        // Pulse and flicker
        const pulse = 1 + Math.sin(t * 3) * 0.08 + Math.sin(t * 7.3) * 0.05;
        const scaleY = (1.6 + (i - 0.5) * 0.6) * pulse;
        const scaleXZ = (1 + (i - 0.5) * 0.3) * (1 + Math.sin(t * 5.1) * 0.04);
        core.scale.set(scaleXZ, scaleY, scaleXZ);
        core.position.y = 0.5 + i * 0.4;

        // Color shifts toward gold at high intensity
        const r = 1;
        const g = 0.3 + i * 0.7;
        const b = 0.05 + i * 0.15;
        coreMat.color.setRGB(r, g, b);
        coreMat.emissive?.setRGB(r * 0.6, g * 0.3, 0);

        innerCore.position.y = core.position.y - 0.05;
        innerCore.scale.set(
          1 + Math.sin(t * 6) * 0.1,
          1.4 + Math.sin(t * 4.5) * 0.15,
          1 + Math.sin(t * 6) * 0.1,
        );

        // ── Light responds to intensity ─────────────────
        pointLight.intensity = 0.5 + i * 2.5;
        pointLight.distance = 3 + i * 6;
        pointLight.color.setRGB(1, 0.35 + i * 0.65, 0.05 + i * 0.15);

        // ── Wisps ────────────────────────────────────────
        for (let w = 0; w < wisps.length; w++) {
          const wisp = wisps[w];
          wisp.rotation.y += dt * (0.4 + w * 0.3 + i * 0.5);
          wisp.rotation.x += dt * (0.2 + w * 0.15) * i;
          const mat = wisp.material as THREE.MeshPhongMaterial;
          mat.opacity = 0.2 + i * 0.4;
          mat.emissiveIntensity = 0.1 + i * 0.6;
          wisp.scale.setScalar(0.8 + i * 0.5);
          wisp.position.y = 0.6 + w * 0.25 + i * 0.3;
        }

        // ── Particles ────────────────────────────────────
        timeSinceLastParticle += dt;
        const emitInterval = isDead ? Infinity : 0.08 - i * 0.05; // faster at high intensity
        if (timeSinceLastParticle >= emitInterval) {
          timeSinceLastParticle = 0;
          spawnParticle();
        }

        for (let p = particles.length - 1; p >= 0; p--) {
          const pt = particles[p];
          pt.life += dt;
          pt.mesh.position.x += pt.velocity.x * dt;
          pt.mesh.position.y += pt.velocity.y * dt;
          pt.mesh.position.z += pt.velocity.z * dt;

          const progress = pt.life / pt.maxLife;
          pt.mesh.scale.setScalar(1 - progress * 0.8);
          (pt.mesh.material as THREE.MeshPhongMaterial).opacity = 1 - progress;

          if (pt.life >= pt.maxLife) {
            scene.remove(pt.mesh);
            pt.mesh.geometry.dispose();
            (pt.mesh.material as THREE.Material).dispose();
            particles.splice(p, 1);
          }
        }
      }

      // ── Camera micro-sway (even when dead) ───────────────
      camera.position.x = Math.sin(t * 0.7) * 0.08;
      camera.position.y = 1.6 + Math.sin(t * 0.5) * 0.06;
      camera.lookAt(0, 0.6, 0);

      renderer.render(scene, camera);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gl as any).endFrameEXP();
    }

    animate();

    // ── Cleanup ──────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />;
}
