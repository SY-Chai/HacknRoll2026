import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, User, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function SavedJournals() {
    const navigate = useNavigate();
    const [userJournals, setUserJournals] = useState([]);
    const [savedJournals, setSavedJournals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAll = async () => {
            try {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

                // 1. Fetch User Created Journals (Locally tracked for privacy)
                let myIds = [];
                try {
                    const rawMyIds = JSON.parse(localStorage.getItem('myJournalIds') || '[]');
                    myIds = rawMyIds.filter(id => uuidRegex.test(id));
                } catch (e) {
                    console.error("Failed to parse my journals:", e);
                }

                if (myIds.length > 0) {
                    const mineRes = await fetch('/api/journal/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: myIds })
                    });
                    const mineData = await mineRes.json();
                    if (mineData.success) {
                        setUserJournals(mineData.data);
                    }
                } else {
                    setUserJournals([]);
                }

                // 2. Fetch Saved Discoveries (Bookmarks)
                let savedIds = [];
                try {
                    const rawSavedIds = JSON.parse(localStorage.getItem('savedJournalIds') || '[]');
                    console.log("[SavedJournals] Raw saved IDs:", rawSavedIds);
                    savedIds = rawSavedIds.filter(id => uuidRegex.test(id));
                    console.log("[SavedJournals] Filtered valid UUIDs:", savedIds);
                } catch (e) {
                    console.error("Failed to parse saved journals:", e);
                }

                if (savedIds.length > 0) {
                    const batchRes = await fetch('/api/journal/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: savedIds })
                    });
                    const batchData = await batchRes.json();
                    if (batchData.success) {
                        setSavedJournals(batchData.data);
                    }
                } else {
                    setSavedJournals([]);
                }
            } catch (error) {
                console.error("Failed to load journals:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAll();
    }, []);

    const JournalCard = ({ journal, type }) => (
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
                alignItems: 'center', // Center content vertically
                gap: '20px', // Add spacing between icon/text/arrow
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
        >
            <div style={{
                background: type === 'mine' ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 200, 255, 0.1)',
                padding: '16px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px'
            }}>
                {type === 'mine' ? <User color="#ffaa00" size={28} /> : <Bookmark color="#00c8ff" size={28} />}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: type === 'mine' ? '#ffaa00' : '#00c8ff' }}>{journal.query || "Untitled Journal"}</h3>
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

                        {/* My Journals Section */}
                        <section>
                            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User size={24} color="#ffaa00" /> My Personal Journals
                            </h2>
                            {userJournals.length === 0 ? (
                                <p style={{ opacity: 0.5, fontStyle: 'italic' }}>You haven't created any journals yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {userJournals.map(j => <JournalCard key={j.id} journal={j} type="mine" />)}
                                </div>
                            )}
                        </section>

                        {/* Saved Section */}
                        <section>
                            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Bookmark size={24} color="#00c8ff" /> Saved Discoveries
                            </h2>
                            {savedJournals.length === 0 ? (
                                <p style={{ opacity: 0.5, fontStyle: 'italic' }}>No saved search results.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {savedJournals.map(j => <JournalCard key={j.id} journal={j} type="saved" />)}
                                </div>
                            )}
                        </section>

                    </div>
                )}
            </div>
        </div>
    );
}
