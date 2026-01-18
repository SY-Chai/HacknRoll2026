
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, Upload, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function CreateJourney() {
    const navigate = useNavigate();

    // Form State
    const [items, setItems] = useState([
        { id: 1, title: '', description: '', image: null, imagePreview: null }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const addItem = () => {
        setItems([
            ...items,
            { id: Date.now(), title: '', description: '', image: null, imagePreview: null }
        ]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleInputChange = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleFileChange = (id, type, file) => {
        if (!file) return;

        const updatedItems = items.map(item => {
            if (item.id === id) {
                const changes = { [type]: file };
                if (type === 'image') {
                    changes.imagePreview = URL.createObjectURL(file);
                }
                return { ...item, ...changes };
            }
            return item;
        });

        setItems(updatedItems);
    };

    const handleSubmit = async () => {
        // Validation
        const isValid = items.every(item => item.title && item.description && item.image);
        if (!isValid) {
            setError("Please fill in Title, Description, and Image for all items.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();

            // 1. Metadata array (Cleaned of file objects)
            const metadata = items.map(item => ({
                title: item.title,
                description: item.description
            }));
            formData.append('items', JSON.stringify(metadata));

            // 2. Append files using predictable field names
            // image_0, audio_0, image_1, audio_1 ...
            items.forEach((item, index) => {
                if (item.image) formData.append(`image_${index}`, item.image);
            });

            const response = await fetch('/api/journal/create', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Upload failed. Please try again.");

            const data = await response.json();

            if (data.success && data.journalId) {
                // Save to 'My Journals' locally for privacy
                const myIds = JSON.parse(localStorage.getItem('myJournalIds') || '[]');
                if (!myIds.includes(data.journalId)) {
                    myIds.push(data.journalId);
                    localStorage.setItem('myJournalIds', JSON.stringify(myIds));
                }

                navigate(`/journey/${data.journalId}`);
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="full-screen" style={{ overflowY: 'auto', paddingBottom: '100px' }}>
            <SceneViewer visualFocus="default" />

            {/* Header */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%',
                padding: '20px 40px', zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
                pointerEvents: 'none' // Allow clicks to pass through except for buttons
            }}>
                <button
                    onClick={() => navigate('/')}
                    className="glass-panel"
                    style={{ padding: '12px', color: 'white', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ChevronLeft size={24} />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Back</span>
                </button>
                <div style={{ color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    My Journal
                </div>
                <div style={{ width: 80 }} /> {/* Spacer */}
            </div>

            <div className="container" style={{ marginTop: '120px', maxWidth: '1000px', position: 'relative', zIndex: 10 }}>

                {/* Intro Text */}
                <div style={{ textAlign: 'center', marginBottom: '40px', color: 'rgba(255,255,255,0.8)' }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontStyle: 'italic', transform: 'rotate(-1deg)' }}>
                        "Collecting moments, curating memories..."
                    </p>
                </div>

                {items.map((item, index) => {
                    const rotation = (index % 3 - 1) * 1.5; // -1.5, 0, 1.5

                    return (
                        <div key={item.id} style={{
                            position: 'relative',
                            marginBottom: '60px',
                            transform: `rotate(${rotation}deg)`,
                            transition: 'all 0.3s ease'
                        }}>

                            {/* Tape Effect */}
                            <div className="tape-strip" style={{
                                position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%) rotate(-1deg)',
                                width: '140px', height: '40px', zIndex: 20
                            }} />

                            {/* Card Content */}
                            <div className="glass-panel" style={{
                                padding: '40px',
                                display: 'grid',
                                gridTemplateColumns: 'minmax(250px, 1fr) 1.5fr',
                                gap: '40px',
                                background: 'rgba(15, 15, 20, 0.75)', // Slightly darker for contrast
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                            }}>

                                {/* Remove Button */}
                                {items.length > 1 && (
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        style={{
                                            position: 'absolute', top: 16, right: 16,
                                            background: 'rgba(255,100,100,0.1)', color: '#ff6b6b',
                                            border: 'none', borderRadius: '50%', padding: '8px',
                                            cursor: 'pointer', zIndex: 30,
                                            transition: 'all 0.2s'
                                        }}
                                        title="Remove Memory"
                                    >
                                        <X size={18} />
                                    </button>
                                )}

                                {/* Left Column: Polaroid Image */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="polaroid-frame" style={{
                                        width: '100%',
                                        aspectRatio: '1/1.1', // Classic Polaroid ratio
                                        background: '#f0f0f0',
                                        display: 'flex', flexDirection: 'column',
                                        position: 'relative',
                                        transform: 'rotate(-2deg)'
                                    }}>
                                        {/* Image Area */}
                                        <div style={{
                                            flex: 1,
                                            background: '#2a2a2a',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            position: 'relative'
                                        }} onClick={() => document.getElementById(`file-input-${item.id}`).click()}>

                                            {item.imagePreview ? (
                                                <img src={item.imagePreview} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>
                                                    <Upload size={32} style={{ marginBottom: '10px', opacity: 0.7 }} />
                                                    <div style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>Tap to Add Photo</div>
                                                </div>
                                            )}

                                            <input
                                                id={`file-input-${item.id}`}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(item.id, 'image', e.target.files[0])}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
                                        {/* Caption Area (Visual only) */}
                                        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontFamily: 'Georgia, serif', color: '#333', fontSize: '1.2rem' }}>
                                                {item.title || "Untitled Memory"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Journal Entry */}
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{
                                            display: 'block', color: 'rgba(255,255,255,0.5)',
                                            fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px'
                                        }}>
                                            Date & Location
                                        </label>
                                        <div style={{ fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
                                            {new Date().toLocaleDateString()} • Singapore
                                        </div>
                                    </div>

                                    {/* Title Input */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <input
                                            type="text"
                                            value={item.title}
                                            onChange={(e) => handleInputChange(item.id, 'title', e.target.value)}
                                            placeholder="Memory Title..."
                                            style={{
                                                width: '100%', padding: '10px 0',
                                                background: 'transparent',
                                                border: 'none',
                                                borderBottom: '2px dashed rgba(255,255,255,0.2)',
                                                color: 'white',
                                                fontSize: '2rem',
                                                fontFamily: 'Georgia, serif',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Description Input */}
                                    <div style={{ marginBottom: '24px', flex: 1 }}>
                                        <textarea
                                            value={item.description}
                                            onChange={(e) => handleInputChange(item.id, 'description', e.target.value)}
                                            placeholder="Write your story here..."
                                            rows={6}
                                            style={{
                                                width: '100%', padding: '15px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'rgba(255,255,255,0.9)',
                                                fontSize: '1.1rem',
                                                fontFamily: 'Georgia, serif',
                                                lineHeight: '1.6',
                                                resize: 'vertical',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Audio Upload Removed - Auto Generated from Description */}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Add Item Button */}
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <button
                        onClick={addItem}
                        style={{
                            background: 'transparent',
                            border: '2px dashed rgba(255,255,255,0.2)',
                            borderRadius: '16px',
                            padding: '16px 32px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.1rem',
                            transition: 'all 0.2s'
                        }}
                        className="hover-glow"
                    >
                        <Plus size={24} />
                        <span>New Page</span>
                    </button>
                </div>

                {/* Floating Action Buffer (FAB) for Save */}
                <div style={{
                    position: 'fixed', bottom: '40px', right: '40px', zIndex: 100
                }}>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            padding: '16px 32px',
                            background: 'var(--text-main)',
                            color: 'var(--bg-dark)',
                            border: 'none',
                            borderRadius: '50px',
                            fontSize: '1.1rem', fontWeight: 600,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            transform: isSubmitting ? 'scale(0.95)' : 'scale(1)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isSubmitting ? <Loader2 className="spinner" /> : <Save size={20} />}
                        <span>{isSubmitting ? 'Binding Journal...' : 'Finish Journal'}</span>
                    </button>
                </div>

                {/* Error Message Toast */}
                {error && (
                    <div style={{
                        position: 'fixed', bottom: '110px', right: '40px', zIndex: 100,
                        background: '#ff6b6b',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        fontWeight: 500,
                        boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

// Add simple hover effect in style block within component or rely on CSS
// I will rely on the inline styles mostly but the .hover-glow class helps.
