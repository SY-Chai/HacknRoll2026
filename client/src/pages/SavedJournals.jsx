import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bookmark, User, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function SavedJournals() {
    const navigate = useNavigate();
    const [journals, setJournals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSaved = async () => {
            try {
                // Fetch ONLY from Local Storage IDs
                const rawSavedIds = JSON.parse(localStorage.getItem('savedJournalIds') || '[]');

                // Filter out non-UUIDs to ensure valid DB queries and migrate away from legacy int IDs
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const savedIds = rawSavedIds.filter(id => uuidRegex.test(id));

                if (savedIds.length > 0) {
                    const batchRes = await fetch('/api/journal/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: savedIds })
                    });
                    const batchData = await batchRes.json();
                    if (batchData.success) {
                        setJournals(batchData.data);
                    }
                } else {
                    setJournals([]);
                }
            } catch (error) {
                console.error("Failed to load journals:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSaved();
    }, []);

    const JournalCard = ({ journal }) => (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(`/journey/${journal.id}`)}
            className="glass-panel"
            style={{
                padding: '24px',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
            <div style={{
                background: journal.user_created ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 200, 255, 0.1)',
                padding: '16px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px'
            }}>
                {journal.user_created ? <User color="#ffaa00" size={28} /> : <Bookmark color="#00c8ff" size={28} />}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: journal.user_created ? '#ffaa00' : '#00c8ff' }}>{journal.query || "Untitled Journal"}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6, fontSize: '0.9rem' }}>
                    <Calendar size={14} />
                    <span>{journal.created_at ? new Date(journal.created_at).toLocaleDateString() : "Saved Journal"}</span>
                </div>
            </div>

            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <ArrowRight size={20} color="white" />
            </div>
        </motion.div>
    );

    return (
        <div className="full-screen" style={{ overflowY: 'auto', background: '#0a0a0f' }}>
            <SceneViewer visualFocus="default" />

            {/* Dark Overlay */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                zIndex: 1
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 10, padding: '40px 20px', maxWidth: '900px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                    <button onClick={() => navigate('/')} className="glass-panel" style={{ padding: '12px', color: 'white' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="glow-text" style={{ fontSize: '2.5rem', margin: 0 }}>Saved <span style={{ fontWeight: 700 }}>Journals</span></h1>
                </div>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                        <Loader2 size={40} className="spinner" />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '40px' }}>
                        <section>
                            {journals.length === 0 ? (
                                <p style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>You haven't saved any journals yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <AnimatePresence>
                                        {journals.map(j => <JournalCard key={j.id} journal={j} />)}
                                    </AnimatePresence>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
