import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Music, Type, ArrowLeft, Send, History, Trash2, Play, Pause, Loader2 } from 'lucide-react';
import SceneViewer from '../components/SceneViewer';

export default function Memories() {
    const navigate = useNavigate();
    const [memories, setMemories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/memories');
            const data = await response.json();
            if (data.success) {
                setMemories(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch memories:", error);
        } finally {
            setIsLoading(false);
        }
    };

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
            const response = await fetch('/api/memories', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                // Reset Form
                setTitle('');
                setDescription('');
                setImageFile(null);
                setAudioFile(null);
                setImagePreview(null);
                // Refresh List
                fetchMemories();
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

            <div className="container" style={{ position: 'relative', zIndex: 10, padding: '40px 20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                    <button onClick={() => navigate('/')} className="glass-panel" style={{ padding: '12px', color: 'white' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="glow-text" style={{ fontSize: '2.5rem', margin: 0 }}>My <span style={{ fontWeight: 700 }}>Memories</span></h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>

                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="glass-panel" style={{ padding: '30px', borderRadius: '24px' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Upload size={20} color="#ffaa00" /> Save a New Memory
                            </h2>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Memory Title</label>
                                    <input
                                        type="text"
                                        placeholder="E.g., Sunday at East Coast Park"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Your Story / Text</label>
                                    <textarea
                                        placeholder="Write something about this moment..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white', outline: 'none', resize: 'none' }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <input type="file" id="img-upload" hidden accept="image/*" onChange={handleImageChange} />
                                        <label htmlFor="img-upload" style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                            padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)',
                                            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                                        }}>
                                            <ImageIcon size={18} /> {imageFile ? 'Changing' : 'Add Photo'}
                                        </label>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <input type="file" id="audio-upload" hidden accept="audio/*" onChange={handleAudioChange} />
                                        <label htmlFor="audio-upload" style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                            padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)',
                                            borderRadius: '12px', cursor: 'pointer'
                                        }}>
                                            <Music size={18} /> {audioFile ? 'Added!' : 'Add Audio'}
                                        </label>
                                    </div>
                                </div>

                                {imagePreview && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    style={{
                                        marginTop: '10px', padding: '16px', background: '#fff', color: '#000',
                                        borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        opacity: isUploading ? 0.7 : 1
                                    }}
                                >
                                    {isUploading ? <Loader2 size={20} className="spinner" /> : <Send size={20} />}
                                    {isUploading ? 'Preserving...' : 'Preserve Memory'}
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Gallery Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <History size={20} color="#ffaa00" /> Preserved Stories
                        </h2>

                        {isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <Loader2 size={32} className="spinner" color="rgba(255,255,255,0.2)" />
                            </div>
                        ) : memories.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                <p>No memories preserved yet. Start by creating one!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {memories.map((memory) => (
                                    <motion.div
                                        key={memory.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-panel"
                                        style={{ padding: '20px', borderRadius: '20px', display: 'flex', gap: '20px' }}
                                    >
                                        {memory.image_url && (
                                            <img src={memory.image_url} alt="" style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }} />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{memory.title}</h3>
                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{new Date(memory.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {memory.description || memory.query}
                                            </p>

                                            {memory.audio_url && (
                                                <audio controls src={memory.audio_url} style={{ marginTop: '12px', width: '100%', height: '32px' }} />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
