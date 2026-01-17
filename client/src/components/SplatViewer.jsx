import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { SplatMesh, SparkControls } from "@sparkjsdev/spark";

const ControlRow = ({ label, value, min, max, step, onChange }) => (
    <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#ccc', fontSize: '12px' }}>
            <span>{label}</span>
            <span>{value.toFixed(2)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
        />
    </div>
);

export default function SplatViewer({ url }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const splatMeshRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    const container = containerRef.current;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Initialize WebGL renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize SparkJS controls
    const controls = new SparkControls({ canvas: renderer.domElement });
    controlsRef.current = controls;

    // Create and add SplatMesh
    const splatMesh = new SplatMesh({ url });
    scene.add(splatMesh);
    splatMeshRef.current = splatMesh;

    // Handle window resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    let lastTime = performance.now();
    const animate = (time) => {
      animationIdRef.current = requestAnimationFrame(animate);

      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      controls.update(camera, deltaTime);
      renderer.render(scene, camera);
    };
    animationIdRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (splatMeshRef.current) {
        scene.remove(splatMeshRef.current);
        splatMeshRef.current.dispose?.();
      }

      if (controlsRef.current) {
        controlsRef.current.dispose?.();
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, [url]);

  if (!url) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#000",
          color: "#fff",
        }}
      >
        No Splat URL provided
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "#000" }}
    />
  );
}
