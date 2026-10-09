"use client";

import * as React from "react";
import * as THREE from "three";

/** Estrella de Space en 3D real (three.js): extruida con bisel, iluminada y girando sobre su eje. */
export default function Star3D({ onReady }: { onReady?: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // sin WebGL: se queda la versión CSS
    }
    const size = host.clientWidth || 112;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    // Misma silueta que el logo (viewBox 64): M32 8l8 16 16 8-16 8-8 16-8-16-16-8 16-8z
    const pts: [number, number][] = [[32, 8], [40, 24], [56, 32], [40, 40], [32, 56], [24, 40], [8, 32], [24, 24]];
    const k = 1 / 24;
    const shape = new THREE.Shape();
    pts.forEach(([x, y], i) => {
      const px = (x - 32) * k, py = -(y - 32) * k;
      i ? shape.lineTo(px, py) : shape.moveTo(px, py);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.12, bevelSegments: 6, curveSegments: 4 });
    geo.center();
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#4A63F0"), roughness: 0.32, metalness: 0.18 });
    const star = new THREE.Mesh(geo, mat);
    scene.add(star);

    scene.add(new THREE.HemisphereLight(0xdfe5ff, 0x1b2a8a, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9db0ff, 1.6);
    rim.position.set(-4, -2, -5);
    scene.add(rim);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      star.rotation.y = reduce ? 0.5 : t * 1.05; // ≈ 6 s por vuelta
      star.rotation.x = reduce ? -0.15 : Math.sin(t * 0.9) * 0.12;
      renderer.render(scene, camera);
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    onReady?.();

    const onResize = () => {
      const s = host.clientWidth || size;
      renderer.setSize(s, s);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return <div ref={ref} className="absolute inset-0" aria-hidden />;
}
