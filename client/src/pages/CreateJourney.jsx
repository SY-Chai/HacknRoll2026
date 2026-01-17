
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, Upload, Save, Loader2 } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function CreateJourney() {
    const navigate = useNavigate();

    // Form State
    const [items, setItems] = useState([
        { id: 1, title: '', description: '', image: null, audio: null, imagePreview: null }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const addItem = () => {
        setItems([
            ...items,
            { id: Date.now(), title: '', description: '', image: null, audio: null, imagePreview: null }
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
                if (item.audio) formData.append(`audio_${index}`, item.audio);
            });

            const response = await fetch('/api/journal/create', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Upload failed. Please try again.");

            const data = await response.json();

            if (data.success && data.journalId) {
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
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)'
            }}>
                <button onClick={() => navigate('/')} className="glass-panel" style={{ padding: '12px', color: 'white' }}>
                    <ChevronLeft size={24} />
                </button>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>Create Journey</div>
                <div style={{ width: 48 }} /> {/* Spacer */}
            </div>

            <div className="container" style={{ marginTop: '100px', maxWidth: '800px', position: 'relative', zIndex: 10 }}>
                {items.map((item, index) => (
                    <div key={item.id} className="glass-panel" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>

                        {/* Remove Button */}
                        {items.length > 1 && (
                            <button
                                onClick={() => removeItem(item.id)}
                                style={{
                                    position: 'absolute', top: 16, right: 16,
                                    background: 'rgba(255,100,100,0.2)', color: '#ff6b6b',
                                    border: 'none', borderRadius: '50%', padding: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={16} />
                            </button>
                        )}

                        <div style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                            Record #{index + 1}
                        </div>

                        {/* Title Input */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>Title</label>
                            <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleInputChange(item.id, 'title', e.target.value)}
                                placeholder="e.g. My Grandmother's House"
                                style={{
                                    width: '100%', padding: '12px',
                                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px', color: 'white', fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* Description Input */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>Description</label>
                            <textarea
                                value={item.description}
                                onChange={(e) => handleInputChange(item.id, 'description', e.target.value)}
                                placeholder="Tell the story of this memory..."
                                rows={4}
                                style={{
                                    width: '100%', padding: '12px',
                                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px', color: 'white', fontSize: '1rem', resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* File Uploads */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {/* Image Upload */}
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>Photo (Required)</label>
                                <div style={{
                                    position: 'relative',
                                    height: '200px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '2px dashed rgba(255,255,255,0.2)',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}>
                                    {item.imagePreview ? (
                                        <img src={item.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                            <Upload size={24} style={{ marginBottom: '8px' }} />
                                            <div>Click to upload</div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(item.id, 'image', e.target.files[0])}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                            </div>

                            {/* Audio Upload */}
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '0.9rem' }}>Audio Narration (Optional)</label>
                                <div style={{
                                    height: '200px',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '2px dashed rgba(255,255,255,0.2)',
                                    borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                        {item.audio ? (
                                            <span style={{ color: '#4cc9f0' }}>{item.audio.name}</span>
                                        ) : (
                                            <>
                                                <Volume2 size={24} style={{ marginBottom: '8px' }} />
                                                <div>Click to upload audio</div>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => handleFileChange(item.id, 'audio', e.target.files[0])}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                ))}

                {/* Add Item Button */}
                <button
                    onClick={addItem}
                    className="glass-panel"
                    style={{
                        width: '100%', padding: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        color: 'white', cursor: 'pointer', marginBottom: '24px'
                    }}
                >
                    <Plus size={20} />
                    <span>Add Another Memory</span>
                </button>

                {/* Confirm Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                        width: '100%', padding: '16px',
                        background: '#fff', border: 'none', borderRadius: '50px',
                        fontSize: '1.1rem', fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                    }}
                >
                    {isSubmitting ? <Loader2 className="spinner" /> : <Save size={20} />}
                    <span>{isSubmitting ? 'Creating Journey...' : 'Save & Create Journey'}</span>
                </button>

                {/* Error Message */}
                {error && (
                    <div style={{
                        marginTop: '20px',
                        background: 'rgba(255,100,100,0.2)',
                        color: '#ff6b6b',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
