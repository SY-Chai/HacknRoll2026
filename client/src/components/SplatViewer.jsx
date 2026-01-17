import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Splat } from '@react-three/drei';

export default function SplatViewer({ url }) {
    if (!url) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#000',
                color: '#fff'
            }}>
                No Splat URL provided
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', background: '#000' }}>
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={60} />
                <OrbitControls />
                <ambientLight intensity={0.5} />
                <Splat src={url} />
            </Canvas>
        </div>
    );
}
