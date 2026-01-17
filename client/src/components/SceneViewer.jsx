import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Float, Text } from '@react-three/drei';

function PlaceholderModel({ type }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    if (type === 'default') return null;

    let color = "#ffffff";
    let geometry = <boxGeometry args={[2, 2, 2]} />;

    if (type === 'temple_ruins') {
        color = "#d4a373";
        geometry = <cylinderGeometry args={[1, 1, 3, 8]} />;
    } else if (type === 'colonial_house') {
        color = "#fefae0";
        geometry = <boxGeometry args={[3, 2, 3]} />;
    } else if (type === 'bunker') {
        color = "#555b6e";
        geometry = <dodecahedronGeometry args={[1.5]} />;
    } else if (type === 'boat_quay') {
        color = "#3a86ff";
        // Fixed: boatGeometry does not exist
        geometry = <boxGeometry args={[3, 0.8, 1.2]} />;
    } else if (type === 'shophouse_street') {
        color = "#e63946";
        geometry = <boxGeometry args={[1, 3, 1]} />;
    } else if (type === 'green_field') {
        color = "#2a9d8f";
        geometry = <planeGeometry args={[10, 10]} />;
    }

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={meshRef}>
                {geometry}
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
            </mesh>
        </Float>
    );
}

export default function SceneViewer({ visualFocus }) {
    return (
        <div className="full-screen" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <spotLight position={[-10, -10, -10]} angle={0.3} />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Environment preset="night" />

                <PlaceholderModel type={visualFocus} />

                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}
