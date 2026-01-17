import React from 'react';
import { useNavigate } from 'react-router-dom';
import SplatViewer from '../components/SplatViewer';
import { ArrowLeft } from 'lucide-react';

export default function SplatPage() {
    const navigate = useNavigate();
    // Using a valid public splat from sparkjs.dev
    const splatURL = 'https://sparkjs.dev/assets/splats/butterfly.spz';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 10,
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    backdropFilter: 'blur(5px)',
                }}
            >
                <ArrowLeft size={24} />
            </button>

            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                color: 'white',
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '10px 20px',
                borderRadius: '20px',
                backdropFilter: 'blur(5px)',
                pointerEvents: 'none',
                textAlign: 'center'
            }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Gaussian Splat Viewer</h2>
                <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
                    Interacting with plush_shiba.splat using Spark
                </p>
            </div>

            <SplatViewer url={splatURL} />
        </div>
    );
}
