import React, { useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { SplatMesh } from '@sparkjsdev/spark';

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
        <div style={{ width: '100%', height: '100vh', background: '#000' }}>
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={60} />
                <OrbitControls />
                <ambientLight intensity={0.5} />
                <Splat url={url} />
            </Canvas>
        </div>
    );
}
