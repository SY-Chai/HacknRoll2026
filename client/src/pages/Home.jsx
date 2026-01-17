import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ArrowRight, Clock, History } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Load recent searches on mount
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    const performSearch = async (query) => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // Add to recent searches
            const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
            setRecentSearches(newRecent);
            localStorage.setItem('recentSearches', JSON.stringify(newRecent));

            // Fetch from backend
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');

            const responseData = await response.json();
            const results = responseData.data || [];

            // Navigate immediately to Journey with all results
            if (results.length > 0) {
                navigate('/journey/search-results', { state: { results, query } });
            } else {
                setError("No results found. Try a different query.");
            }

        } catch (err) {
            console.error(err);
            setError("Failed to fetch results. Ensure backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        performSearch(searchTerm);
    };

    return (
        <div className="full-screen" style={{ position: 'relative' }}>
            <SceneViewer visualFocus="default" />

            <div className="container" style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px' }}>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ textAlign: 'center', marginBottom: '40px' }}
                >
                    <h1 className="glow-text" style={{ fontSize: '4rem', fontWeight: 700, marginBottom: '16px' }}>
                        Time Capsule <span style={{ color: 'var(--accent-primary)' }}>SG</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                        Search for a landmark or event (e.g. "Raffles Hotel", "1960s").
                    </p>
                </motion.div>

                {/* Search Bar */}
                <motion.form
                    onSubmit={handleSearchSubmit}
                    className="glass-panel"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '600px',
                        marginBottom: '40px'
                    }}
                >
                    <Search color="var(--text-muted)" size={24} />
                    <input
                        type="text"
                        placeholder="Search Singapore's history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.2rem',
                            marginLeft: '16px',
                            width: '100%',
                            outline: 'none'
                        }}
                    />
                    {isLoading && <div className="spinner" style={{ width: 20, height: 20, border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%' }} />}
                </motion.form>

                {/* Recent Searches (only if not loading) */}
                {!isLoading && recentSearches.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ width: '100%', maxWidth: '600px', marginBottom: '40px' }}
                    >
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <History size={16} /> Recent Searches
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {recentSearches.map((term, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setSearchTerm(term); performSearch(term); }}
                                    className="glass-panel"
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: '0.9rem',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {error && <div style={{ color: '#ff6b6b', marginTop: '20px' }}>{error}</div>}

            </div>
        </div>
    );
}
