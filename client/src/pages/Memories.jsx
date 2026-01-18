import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Plus, X, ArrowLeft, Send, Loader2 } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function Memories() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Form State: Array of items { id, title, description, imageFile, imagePreview }
    const [journalTitle, setJournalTitle] = useState('');
    const [items, setItems] = useState([
        { id: Date.now(), title: '', description: '', imageFile: null, imagePreview: null }
    ]);

    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            { id: Date.now(), title: '', description: '', imageFile: null, imagePreview: null }
        ]);
    };

    const handleRemoveItem = (id) => {
        if (items.length === 1) return; // Keep at least one
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const updateItem = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleImageChange = (id, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setItems(prev => prev.map(item => {
                    if (item.id === id) {
                        return { ...item, imageFile: file, imagePreview: reader.result };
                    }
                    return item;
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const validItems = items.filter(i => i.imageFile && i.description);
        if (validItems.length === 0) {
            alert("Please add at least one memory with a photo and description.");
            return;
        }

        setIsLoading(true);
        const formData = new FormData();

        // Construct Metadata Array
        const metadata = validItems.map(item => ({
            title: item.title || 'Untitled Memory',
            description: item.description
        }));

        formData.append('items', JSON.stringify(metadata));
        formData.append('journalTitle', journalTitle || 'My Journal');

        // Append Files
        validItems.forEach((item, index) => {
            formData.append(`image_${index}`, item.imageFile);
            // No audio upload anymore, auto-generated backend
        });

        try {
            const response = await fetch('/api/journal/create', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                // Save to 'My Journals' locally for privacy
                let myIds = [];
                try {
                    myIds = JSON.parse(localStorage.getItem('myJournalIds') || '[]');
                } catch (e) {
                    console.error("Failed to parse my journals:", e);
                }

                if (!myIds.includes(data.journalId)) {
                    myIds.push(data.journalId);
                    localStorage.setItem('myJournalIds', JSON.stringify(myIds));
                }

                // Redirect to the new Journey
                navigate(`/journey/${data.journalId}`);
            } else {
                alert("Failed to preserve memories: " + data.error);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="full-screen" style={{ overflowY: 'auto', background: '#0a0a0f' }}>
            <SceneViewer visualFocus="default" />

            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
                zIndex: 1
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 10, padding: '40px 20px', maxWidth: '800px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                    <button onClick={() => navigate('/')} className="glass-panel" style={{ padding: '12px', color: 'white' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="glow-text" style={{ fontSize: '2.5rem', margin: 0 }}>Create a <span style={{ fontWeight: 700 }}>Journal</span></h1>
                </div>

                <div className="glass-panel" style={{ padding: '30px', borderRadius: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Upload size={20} color="#ffaa00" /> Share Your Memories
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px', fontSize: '0.9rem' }}>
                        Upload your photos and tell their stories. We will enhance the images and generate a voice narration for you.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                        {/* Journal Title */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Journal Title (Optional)</label>
                            <input
                                type="text"
                                placeholder="E.g., Graduation"
                                value={journalTitle}
                                onChange={(e) => setJournalTitle(e.target.value)}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }}
                            />
                        </div>

                        <AnimatePresence>
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#ffaa00' }}>Memory #{index + 1}</h3>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.id)}
                                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                                        {/* Image Upload */}
                                        <div style={{ width: '100%' }}>
                                            <input
                                                type="file"
                                                id={`img-${item.id}`}
                                                hidden
                                                accept="image/*"
                                                onChange={(e) => handleImageChange(item.id, e)}
                                            />
                                            <label htmlFor={`img-${item.id}`} style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                padding: '20px', background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.2)',
                                                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                                                height: '200px', objectFit: 'cover', overflow: 'hidden'
                                            }}>
                                                {item.imagePreview ? (
                                                    <img src={item.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <>
                                                        <ImageIcon size={32} color="rgba(255,255,255,0.5)" />
                                                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Click to Add Photo</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>

                                        {/* Text Fields */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <input
                                                type="text"
                                                placeholder="Title of this memory..."
                                                value={item.title}
                                                onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: 'white', outline: 'none' }}
                                            />
                                            <textarea
                                                placeholder="Describe exactly what happened here..."
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                rows={3}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: 'white', outline: 'none', resize: 'vertical' }}
                                                required
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="glass-panel"
                            style={{
                                padding: '12px', border: '1px dashed rgba(255,255,255,0.3)', background: 'transparent',
                                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <Plus size={20} /> Add Another Photo
                        </button>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                marginTop: '10px', padding: '16px', background: '#ffaa00', color: '#000',
                                borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                opacity: isLoading ? 0.7 : 1,
                                fontSize: '1.1rem'
                            }}
                        >
                            {isLoading ? <Loader2 size={24} className="spinner" /> : <Send size={24} />}
                            {isLoading ? 'Processing Journal...' : 'Create Journal'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
