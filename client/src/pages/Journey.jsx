import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { locations } from '../data/locations';
import SceneViewer from '../components/SceneViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Home as HomeIcon } from 'lucide-react';

export default function Journey() {
    const { id } = useParams();
    const navigate = useNavigate();
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

                    <button onClick={() => setIsMuted(!isMuted)} className="glass-panel" style={{ padding: '12px', color: 'white' }}>
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>

                {/* Bottom Story Card */}
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

                            {/* Fake Audio Progress Bar */}
                            {!isMuted && (
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', marginTop: '16px', borderRadius: '2px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 10, ease: 'linear' }} // simulating 10s audio
                                        style={{ height: '100%', background: location.color }}
                                    />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
