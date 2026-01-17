import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locations } from '../data/locations';
import { motion } from 'framer-motion';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [startYear, setStartYear] = useState('1960');
    const [endYear, setEndYear] = useState('1970');
    const navigate = useNavigate();

    const filteredLocations = locations.filter(loc =>
        loc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNavigate = (id) => {
        navigate(`/journey/${id}`, { state: { startYear, endYear } });
    };

    return (
        <div className="full-screen" style={{ position: 'relative' }}>
            {/* Background 3D Elements */}
            <SceneViewer visualFocus="default" />

            <div className="container" style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

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
                        Explore Singapore's history through immersive 3D journeys and archival records.
                    </p>
                </motion.div>

                {/* Search & Filter Bar */}
                <motion.div
                    className="glass-panel"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '600px',
                        marginBottom: '40px'
                    }}
                >
                    {/* Location Search */}
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                        <Search color="var(--text-muted)" size={20} />
                        <input
                            type="text"
                            placeholder="Search location (e.g. Chinatown)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.2rem',
                                marginLeft: '12px',
                                width: '100%',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Timeframe Inputs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Time Era:</span>
                        <input
                            type="number"
                            placeholder="Start"
                            value={startYear}
                            onChange={(e) => setStartYear(e.target.value)}
                            className="glass-panel"
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '8px',
                                borderRadius: '8px',
                                width: '100px',
                                textAlign: 'center'
                            }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                        <input
                            type="number"
                            placeholder="End"
                            value={endYear}
                            onChange={(e) => setEndYear(e.target.value)}
                            className="glass-panel"
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '8px',
                                borderRadius: '8px',
                                width: '100px',
                                textAlign: 'center'
                            }}
                        />
                    </div>
                </motion.div>

                {/* Results Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', width: '100%' }}>
                    {filteredLocations.map((loc, index) => (
                        <motion.div
                            key={loc.id}
                            className="glass-panel"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (index * 0.1) }}
                            whileHover={{ scale: 1.05, backgroundColor: 'var(--bg-card-hover)' }}
                            onClick={() => handleNavigate(loc.id)}
                            style={{ padding: '24px', cursor: 'pointer', borderLeft: `4px solid ${loc.color}` }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{loc.title}</h3>
                                <ArrowRight size={20} color={loc.color} />
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                                {loc.shortDescription}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={14} color="var(--text-muted)" />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{loc.era}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
}
