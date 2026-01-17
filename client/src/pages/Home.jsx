import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { locations } from '../data/locations';
import { motion } from 'framer-motion';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredLocations = locations.filter(loc =>
        loc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        Explore Singapore's history through immersive 3D journeys. Type a location to begin your adventure.
                    </p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    className="glass-panel"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '500px',
                        marginBottom: '40px'
                    }}
                >
                    <Search color="var(--text-muted)" size={24} />
                    <input
                        type="text"
                        placeholder="Search for a location (e.g. Fort Canning)..."
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
                            onClick={() => navigate(`/journey/${loc.id}`)}
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
