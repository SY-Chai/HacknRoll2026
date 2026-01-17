import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Music, ArrowLeft, Send, Loader2 } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function Memories() {
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);

    // Form State (Single Memory)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (file) setAudioFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('title', title || 'Untitled Memory');
        formData.append('description', description);
        if (imageFile) formData.append('image', imageFile);
        if (audioFile) formData.append('audio', audioFile);

        try {
            const response = await fetch('/api/journal/create-memory', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                // Auto-save the new journal to local storage
                const savedIds = JSON.parse(localStorage.getItem('savedJournalIds') || '[]');
                if (!savedIds.includes(data.journalId)) {
                    localStorage.setItem('savedJournalIds', JSON.stringify([...savedIds, data.journalId]));
                }

                // Redirect to the new Journey
                navigate(`/journey/${data.journalId}`);
            } else {
                alert("Failed to upload: " + data.error);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed.");
        } finally {
            setIsUploading(false);
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

            <div className="container" style={{ position: 'relative', zIndex: 10, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>

                {/* Header */}
                <div style={{ width: '100%', maxWidth: '600px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                    <button onClick={() => navigate('/')} className="glass-panel" style={{ padding: '12px', color: 'white' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="glow-text" style={{ fontSize: '2rem', margin: 0 }}>Create <span style={{ fontWeight: 700 }}>Memory</span></h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel"
                    style={{ padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '600px' }}
                >
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Upload size={20} color="#ffaa00" /> Share Your Story
                    </h2>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Journal Title */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Title</label>
                            <input
                                type="text"
                                placeholder="E.g., Graduation Day"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none', fontSize: '1.1rem' }}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Description</label>
                            <textarea
                                placeholder="Write about this moment..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none', resize: 'none', fontSize: '1rem', lineHeight: '1.5' }}
                                required
                            />
                        </div>

                        {/* File Uploads */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ position: 'relative' }}>
                                <input type="file" id="img-upload" hidden accept="image/*" onChange={handleImageChange} />
                                <label htmlFor="img-upload" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)',
                                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    <ImageIcon size={20} /> {imageFile ? 'Change Photo' : 'Add Photo'}
                                </label>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input type="file" id="audio-upload" hidden accept="audio/*" onChange={handleAudioChange} />
                                <label htmlFor="audio-upload" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)',
                                    borderRadius: '12px', cursor: 'pointer'
                                }}>
                                    <Music size={20} /> {audioFile ? 'Change Audio' : 'Add Audio'}
                                </label>
                            </div>
                        </div>

                        {imagePreview && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }} />
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={isUploading}
                            style={{
                                marginTop: '10px', padding: '16px', background: '#fff', color: '#000',
                                borderRadius: '30px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                opacity: isUploading ? 0.7 : 1, fontSize: '1.1rem'
                            }}
                        >
                            {isUploading ? <Loader2 size={22} className="spinner" /> : <Send size={22} />}
                            {isUploading ? 'Preserving...' : 'Preserve Memory'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
