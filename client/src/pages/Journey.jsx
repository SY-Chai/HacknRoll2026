import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SceneViewer from '../components/SceneViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home as HomeIcon } from 'lucide-react';

export default function Journey() {
    const { state } = useLocation();
    const navigate = useNavigate();

    // Support both single result (legacy/direct/refresh) and array of results (carousel)
    const results = state?.results || (state?.result ? [state.result] : []);
    const query = state?.query || "Journey";

    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

    // Construct "Location" object from mapped search results
    const locationData = results.length > 0 ? {
        id: 'dynamic-search',
        title: `Search: "${query}"`,
        color: '#ffaa00',
        chapters: results.map((item, index) => ({
            id: index.toString(),
            title: item.title,
            text: item.description || "No description available.",
            visualFocus: 'default',
            img_url: item.imageUrl, // Fixed: Scraper returns 'imageUrl', not 'img_url'
            date: item.date
        }))
    } : null;

    const locationChapters = locationData ? locationData.chapters : [];
    const currentChapter = locationChapters[currentChapterIndex];

    // Handle missing state (e.g. refresh)
    if (!locationData) {
        return (
            <div className="full-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <p>No journey data found.</p>
                <button
                    onClick={() => navigate('/')}
                    className="glass-panel"
                    style={{ marginTop: '20px', padding: '12px 24px', cursor: 'pointer', color: 'white' }}
                >
                    Return to Home
                </button>
            </div>
        );
    }

    const nextChapter = () => {
        if (currentChapterIndex < locationChapters.length - 1) {
            setCurrentChapterIndex(prev => prev + 1);
        }
    };

    const prevChapter = () => {
        if (currentChapterIndex > 0) {
            setCurrentChapterIndex(prev => prev - 1);
        }
    };

    return (
        <div className="full-screen" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <SceneViewer visualFocus={currentChapter.visualFocus} />

            {/* Header: Title */}
            <div style={{ padding: '24px', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => navigate('/')} className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                    <HomeIcon size={20} />
                    <span>Back</span>
                </button>
                <div className="glass-panel" style={{ padding: '12px 24px' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        {currentChapter.title}
                    </h1>
                </div>
                <div style={{ width: 80 }}></div> {/* Spacer */}
            </div>

            {/* Main Content: 3-Image Carousel */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>

                {/* Previous Image (Left, Blurred) */}
                <AnimatePresence>
                    {currentChapterIndex > 0 && locationChapters[currentChapterIndex - 1] && (
                        <motion.div
                            key={`prev-${currentChapterIndex}`}
                            initial={{ opacity: 0, x: -100, scale: 0.8 }}
                            animate={{ opacity: 0.4, x: -250, scale: 0.85, filter: 'blur(4px)' }}
                            exit={{ opacity: 0, x: -300 }}
                            transition={{ duration: 0.4 }}
                            onClick={prevChapter}
                            style={{
                                position: 'absolute',
                                height: '60%',
                                aspectRatio: '4/3',
                                cursor: 'pointer',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '2px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            <img
                                src={locationChapters[currentChapterIndex - 1].img_url}
                                alt="Previous"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Left Arrow */}
                <button
                    onClick={prevChapter}
                    disabled={currentChapterIndex === 0}
                    style={{
                        position: 'absolute', left: '10%',
                        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '12px',
                        color: 'white', opacity: currentChapterIndex === 0 ? 0 : 1, cursor: 'pointer', zIndex: 20
                    }}
                >
                    <ChevronLeft size={32} />
                </button>

                {/* Current Image (Center, Sharp, Large) */}
                <motion.div
                    key={currentChapter.id}
                    layoutId={currentChapter.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                        height: '70%',
                        aspectRatio: '4/3',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        border: '4px solid rgba(255,255,255,0.1)',
                        zIndex: 15,
                        background: '#111'
                    }}
                >
                    {currentChapter.img_url ? (
                        <img
                            src={currentChapter.img_url}
                            alt={currentChapter.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222' }}>
                            <p style={{ color: '#666' }}>No Image</p>
                        </div>
                    )}
                </motion.div>

                {/* Right Arrow */}
                <button
                    onClick={nextChapter}
                    disabled={currentChapterIndex === locationChapters.length - 1}
                    style={{
                        position: 'absolute', right: '10%',
                        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '12px',
                        color: 'white', opacity: currentChapterIndex === locationChapters.length - 1 ? 0 : 1, cursor: 'pointer', zIndex: 20
                    }}
                >
                    <ChevronRight size={32} />
                </button>

                {/* Next Image (Right, Blurred) */}
                <AnimatePresence>
                    {currentChapterIndex < locationChapters.length - 1 && locationChapters[currentChapterIndex + 1] && (
                        <motion.div
                            key={`next-${currentChapterIndex}`}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 0.4, x: 250, scale: 0.85, filter: 'blur(4px)' }}
                            exit={{ opacity: 0, x: 300 }}
                            transition={{ duration: 0.4 }}
                            onClick={nextChapter}
                            style={{
                                position: 'absolute',
                                height: '60%',
                                aspectRatio: '4/3',
                                cursor: 'pointer',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '2px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            <img
                                src={locationChapters[currentChapterIndex + 1].img_url}
                                alt="Next"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Footer: Description */}
            <div style={{ padding: '24px 48px', zIndex: 10, textAlign: 'center', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                <motion.p
                    key={currentChapter.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel"
                    style={{
                        maxWidth: '800px',
                        margin: '0 auto',
                        padding: '16px 24px',
                        fontSize: '1.1rem',
                        color: '#ddd',
                        lineHeight: 1.6
                    }}
                >
                    {currentChapter.text}
                </motion.p>
                <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#888' }}>
                    {currentChapter.date}
                </div>
            </div>

        </div>
    );
}
