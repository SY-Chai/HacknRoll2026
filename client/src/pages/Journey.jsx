import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { locations } from '../data/locations';
import SceneViewer from '../components/SceneViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Home as HomeIcon, Image as ImageIcon } from 'lucide-react';

export default function Journey() {
    const { id } = useParams();
    const navigate = useNavigate();
    const locationState = useLocation().state || {};
    const { startYear = '1960', endYear = '1970' } = locationState;

    const location = locations.find(l => l.id === id);

    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    if (!location) return <div>Location not found</div>;

    const chapters = location.chapters;
    const currentChapter = chapters[currentChapterIndex];

    const nextChapter = () => {
        if (currentChapterIndex < chapters.length - 1) {
            setCurrentChapterIndex(prev => prev + 1);
        }
    };

    const prevChapter = () => {
        if (currentChapterIndex > 0) {
            setCurrentChapterIndex(prev => prev - 1);
        }
    };

    const [showArchives, setShowArchives] = useState(false);
    const [archivalImages, setArchivalImages] = useState([]);
    const [loadingArchives, setLoadingArchives] = useState(false);

    const handleViewArchives = async () => {
        setShowArchives(true);
        setLoadingArchives(true);

        // Check if we already have images to avoid refetching
        if (archivalImages.length > 0) {
            setLoadingArchives(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/scrape?query=${location.title}&startYear=${startYear}&endYear=${endYear}`);
            const data = await response.json();
            setArchivalImages(data.results || []);
        } catch (error) {
            console.error("Failed to fetch archives:", error);
        } finally {
            setLoadingArchives(false);
        }
    };

    return (
        <div className="full-screen">
            {/* 3D Scene Layer */}
            <SceneViewer visualFocus={currentChapter.visualFocus} />

            {/* UI Overlay Layer */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, padding: '24px', pointerEvents: 'none' }}>

                {/* Top Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
                    <button onClick={() => navigate('/')} className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                        <HomeIcon size={20} />
                        <span>Back to Map</span>
                    </button>

                    <div className="glass-panel" style={{ padding: '8px 16px' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: location.color }}>{location.title}</h2>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleViewArchives}
                            className="glass-panel"
                            style={{ padding: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--accent-secondary)' }}
                        >
                            <ImageIcon size={20} />
                            <span style={{ fontSize: '0.9rem' }}>Archives ({startYear}-{endYear})</span>
                        </button>

                        <button onClick={() => setIsMuted(!isMuted)} className="glass-panel" style={{ padding: '12px', color: 'white' }}>
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                    </div>
                </div>

                {/* Bottom Story Card - Only show if not viewing archives */}
                {!showArchives && (
                    <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '800px', pointerEvents: 'auto' }}>
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={currentChapter.id}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="glass-panel"
                                style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: location.color }}>
                                        Chapter {currentChapterIndex + 1} / {chapters.length}
                                    </span>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={prevChapter}
                                            disabled={currentChapterIndex === 0}
                                            style={{ opacity: currentChapterIndex === 0 ? 0.5 : 1, color: 'white' }}
                                        >
                                            <ChevronLeft size={32} />
                                        </button>
                                        <button
                                            onClick={nextChapter}
                                            disabled={currentChapterIndex === chapters.length - 1}
                                            style={{ opacity: currentChapterIndex === chapters.length - 1 ? 0.5 : 1, color: 'white' }}
                                        >
                                            <ChevronRight size={32} />
                                        </button>
                                    </div>
                                </div>

                                <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{currentChapter.title}</h2>
                                <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#e0e0e0' }}>
                                    {currentChapter.text}
                                </p>

                                {!isMuted && (
                                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', marginTop: '16px', borderRadius: '2px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: '0%' }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 10, ease: 'linear' }}
                                            style={{ height: '100%', background: location.color }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}

                {/* Archives Modal */}
                <AnimatePresence>
                    {showArchives && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', pointerEvents: 'auto' }}
                        >
                            <div className="glass-panel" style={{ width: '100%', height: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Archival Records ({startYear} - {endYear})</h2>
                                    <button onClick={() => setShowArchives(false)} style={{ color: 'white', fontSize: '1.5rem' }}>&times;</button>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                    {loadingArchives ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                            <p>Loading records from National Archives...</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                            {archivalImages.map((img, i) => (
                                                <div key={i} style={{ breakInside: 'avoid' }}>
                                                    <a href={img.link} target="_blank" rel="noreferrer">
                                                        <img
                                                            src={`http://localhost:3000/api/proxy-image?url=${encodeURIComponent(img.imageUrl)}`}
                                                            alt={img.title}
                                                            style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', objectFit: 'cover' }}
                                                        />
                                                    </a>
                                                    <p style={{ fontSize: '0.8rem', color: '#ccc' }}>{img.title}</p>
                                                </div>
                                            ))}
                                            {archivalImages.length === 0 && <p>No images found for this era.</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
