import React, { useMemo, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";

function Splat({ url }) {
  const splat = useMemo(() => {
    return new SplatMesh({
      url: url,
    });
  }, [url]);

  useEffect(() => {
    return () => {
      // Cleanup if spark provides a dispose method on SplatMesh
      if (splat.dispose) {
        splat.dispose();
      }
    };
  }, [splat]);

  return <primitive object={splat} />;
}

// Camera controller for arrow keys + WASD movement
function CameraController({ controlsRef, moveSpeed = 0.05 }) {
  const { camera } = useThree();
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          keys.current.forward = true;
          break;
        case "s":
        case "arrowdown":
          keys.current.backward = true;
          break;
        case "a":
        case "arrowleft":
          keys.current.left = true;
          break;
        case "d":
        case "arrowright":
          keys.current.right = true;
          break;
        case "e":
          keys.current.up = true;
          break;
        case "q":
          keys.current.down = true;
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          keys.current.forward = false;
          break;
        case "s":
        case "arrowdown":
          keys.current.backward = false;
          break;
        case "a":
        case "arrowleft":
          keys.current.left = false;
          break;
        case "d":
        case "arrowright":
          keys.current.right = false;
          break;
        case "e":
          keys.current.up = false;
          break;
        case "q":
          keys.current.down = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame(() => {
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    right.crossVectors(direction, up).normalize();

    let moved = false;

    if (keys.current.forward) {
      camera.position.addScaledVector(direction, moveSpeed);
      moved = true;
    }
    if (keys.current.backward) {
      camera.position.addScaledVector(direction, -moveSpeed);
      moved = true;
    }
    if (keys.current.left) {
      camera.position.addScaledVector(right, -moveSpeed);
      moved = true;
    }
    if (keys.current.right) {
      camera.position.addScaledVector(right, moveSpeed);
      moved = true;
    }
    if (keys.current.down) {
      camera.position.y -= moveSpeed;
      moved = true;
    }
    if (keys.current.up) {
      camera.position.y += moveSpeed;
      moved = true;
    }

    if (moved && controlsRef.current) {
      const target = new THREE.Vector3();
      camera.getWorldDirection(target);
      target.multiplyScalar(3);
      target.add(camera.position);
      controlsRef.current.target.copy(target);
    }
  });

  return null;
}

const ControlRow = ({ label, value, min, max, step, onChange }) => (
  <div style={{ marginBottom: "8px" }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "2px",
        color: "#ccc",
        fontSize: "12px",
      }}
    >
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
      style={{ width: "100%", cursor: "pointer" }}
    />
  </div>
);

export default function SplatViewer({
  url,
  fillContainer = false,
  hideControls = false,
}) {
  const [scale, setScale] = React.useState(2);
  const [rotation, setRotation] = React.useState([Math.PI, 0, 0]); // Default flip X
  const [position, setPosition] = React.useState([0, 0, 0]);
  const [showControls, setShowControls] = React.useState(!hideControls);
  const orbitControlsRef = useRef(null);

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
      style={{
        width: "100%",
        height: fillContainer ? "100%" : "100vh",
        background: "#111",
        position: "relative",
      }}
    >
      {/* Control Panel */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
          padding: "16px",
          borderRadius: "12px",
          color: "white",
          zIndex: 100,
          width: "220px",
          border: "1px solid rgba(255,255,255,0.1)",
          display: showControls ? "block" : "none",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "14px",
            borderBottom: "1px solid #444",
            paddingBottom: "8px",
          }}
        >
          Model Controls
        </h3>

        <ControlRow
          label="Scale"
          value={scale}
          min={0.1}
          max={10}
          step={0.1}
          onChange={setScale}
        />

        <div
          style={{
            marginTop: "12px",
            borderTop: "1px solid #333",
            paddingTop: "8px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
            ROTATION
          </div>
          <ControlRow
            label="X"
            value={rotation[0]}
            min={-Math.PI}
            max={Math.PI}
            step={0.1}
            onChange={(v) => setRotation([v, rotation[1], rotation[2]])}
          />
          <ControlRow
            label="Y"
            value={rotation[1]}
            min={-Math.PI}
            max={Math.PI}
            step={0.1}
            onChange={(v) => setRotation([rotation[0], v, rotation[2]])}
          />
          <ControlRow
            label="Z"
            value={rotation[2]}
            min={-Math.PI}
            max={Math.PI}
            step={0.1}
            onChange={(v) => setRotation([rotation[0], rotation[1], v])}
          />
        </div>

        <div
          style={{
            marginTop: "12px",
            borderTop: "1px solid #333",
            paddingTop: "8px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>
            POSITION
          </div>
          <ControlRow
            label="Y (Up/Down)"
            value={position[1]}
            min={-5}
            max={5}
            step={0.1}
            onChange={(v) => setPosition([position[0], v, position[2]])}
          />
        </div>
      </div>

      {!hideControls && (
        <button
          onClick={() => setShowControls(!showControls)}
          style={{
            position: "absolute",
            top: "20px",
            right: showControls ? "250px" : "20px",
            zIndex: 100,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "right 0.3s ease",
          }}
        >
          {showControls ? "Hide" : "Controls"}
        </button>
      )}

      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={50} />

        <OrbitControls
          ref={orbitControlsRef}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={0.1}
          maxDistance={20}
          reverseOrbit={true}
          enablePan={true}
          panSpeed={0.5}
        />

        <CameraController controlsRef={orbitControlsRef} moveSpeed={0.05} />

        <ambientLight intensity={1.0} />

        <group
          scale={[scale, scale, scale]}
          rotation={rotation}
          position={position}
        >
          <Splat url={url} />
        </group>
      </Canvas>
    </div>
  );
}
