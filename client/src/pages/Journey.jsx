import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SceneViewer from "../components/SceneViewer";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  X,
  Maximize2,
  Volume2,
  VolumeX,
  Loader2,
  Play,
  Pause,
  Palette,
} from "lucide-react";

export default function Journey() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Support both single result (legacy/direct/refresh) and array of results (carousel)
  const results = state?.results || (state?.result ? [state.result] : []);

  // Initialize chapters state from search results
  const initialChapters = results.map((item, index) => ({
    id: index.toString(),
    title: item.title,
    text: item.description || "No description available.",
    visualFocus: "default",
    // Use proxy for images to avoid CORs/Hotlink issues
    img_url: item.imageUrl
      ? `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`
      : null,
    date: item.date,
    audio_url: item.audio || null,
    colorized_url: null, // AI colorized version
    isColorMode: false, // Toggle between original and colorized
  }));

  // Use State for chapters to allow updating audio URLs dynamically
  const [chapters, setChapters] = useState(initialChapters);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  // Audio State
  const [isMuted, setIsMuted] = useState(true); // Default to Muted
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioProcessing, setIsAudioProcessing] = useState(false);
  const [isColorizing, setIsColorizing] = useState(false);

  // UI State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const audioRef = useRef(null);
  const currentChapter = chapters[currentChapterIndex];

  // Handle missing state
  if (chapters.length === 0) {
    return (
      <div
        className="full-screen"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <p>No journey data found.</p>
        <button
          onClick={() => navigate("/")}
          className="glass-panel"
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            cursor: "pointer",
            color: "white",
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  /* --- Audio Logic Start --- */

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setAudioProgress(0);
    }
  };

  const playAudio = (url) => {
    if (!url) return;
    const fullUrl = url.startsWith("http") ? url : url;

    if (!audioRef.current.src.includes(url)) {
      audioRef.current.src = fullUrl;
      audioRef.current.load();
    }

    if (!isMuted) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((e) => console.error("Audio Play Error:", e));
      }
    }
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const updateProgress = () => {
      if (audio.duration) {
        setAudioProgress(audio.currentTime / audio.duration);
      }
    };

    const onEnd = () => {
      setIsPlaying(false);
      setAudioProgress(1);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", onEnd);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!currentChapter) return;

    const capturedIndex = currentChapterIndex;
    const fetchAudioIfNeeded = async () => {
      if (chapters[capturedIndex].audio_url) return;

      setIsAudioProcessing(true);
      try {
        // Stable ID for caching
        const safeTitle = currentChapter.title
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 30);
        const stableId = `${safeTitle}_${currentChapter.date ? currentChapter.date.replace(/[^a-zA-Z0-9]/g, "") : "nodate"}`;

        const response = await fetch("/api/generate-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: currentChapter.text,
            id: stableId,
          }),
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.audioUrl) {
          setChapters((prevChapters) => {
            const newChapters = [...prevChapters];
            if (newChapters[capturedIndex]) {
              newChapters[capturedIndex] = {
                ...newChapters[capturedIndex],
                audio_url: data.audioUrl,
              };
            }
            return newChapters;
          });
        }
      } catch (error) {
        console.warn("Failed to fetch audio:", error);
      } finally {
        setIsAudioProcessing(false);
      }
    };

    fetchAudioIfNeeded();
  }, [currentChapterIndex, currentChapter?.text]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentChapter) return;

    if (currentChapter.audio_url) {
      const currentSrc = audio.src;
      if (!currentSrc.includes(currentChapter.audio_url)) {
        playAudio(currentChapter.audio_url);
      } else {
        if (isMuted) {
          audio.pause();
          setIsPlaying(false);
        } else {
          if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => setIsPlaying(true))
                .catch((e) => console.error("Audio Play Error:", e));
            }
          }
        }
      }
    } else {
      stopAudio();
    }
  }, [currentChapterIndex, isMuted, currentChapter?.audio_url]);

  /* --- Audio Logic End --- */

  const nextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex((prev) => prev + 1);
      setAudioProgress(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex((prev) => prev - 1);
      setAudioProgress(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleColorize = async () => {
    if (currentChapter.colorized_url) {
      setChapters((prev) => {
        const next = [...prev];
        next[currentChapterIndex].isColorMode =
          !next[currentChapterIndex].isColorMode;
        return next;
      });
      return;
    }

    setIsColorizing(true);
    try {
      const originalUrl = results[currentChapterIndex].imageUrl;
      const response = await fetch("/api/colorize-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: originalUrl }),
      });

      if (!response.ok) throw new Error("Colorization failed");

      const data = await response.json();
      if (data.success && data.colorUrl) {
        setChapters((prev) => {
          const next = [...prev];
          next[currentChapterIndex] = {
            ...next[currentChapterIndex],
            colorized_url: data.colorUrl,
            isColorMode: true,
          };
          return next;
        });
      }
    } catch (error) {
      console.error("Colorization error:", error);
    } finally {
      setIsColorizing(false);
    }
  };

  return (
    <div
      className="full-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "auto",
      }}
    >
      <SceneViewer visualFocus={currentChapter.visualFocus} />

      {/* Header: Title & Controls */}
      <div
        style={{
          padding: "12px 24px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          <button
            onClick={() => navigate("/")}
            className="glass-panel"
            style={{
              padding: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "white",
            }}
          >
            <HomeIcon size={20} />
            <span>Back</span>
          </button>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: "12px 32px",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "50%",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              margin: 0,
              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentChapter.title}
          </h1>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* Colorize Toggle */}
          <button
            onClick={handleColorize}
            disabled={isColorizing}
            className="glass-panel"
            style={{
              padding: "12px 20px",
              background: currentChapter.isColorMode
                ? "rgba(255, 170, 0, 0.2)"
                : "rgba(255, 255, 255, 0.1)",
              border: currentChapter.isColorMode
                ? "1px solid rgba(255, 170, 0, 0.5)"
                : "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
          >
            {isColorizing ? (
              <Loader2 size={18} className="spinner" />
            ) : (
              <Palette size={18} />
            )}
            <span style={{ fontWeight: 600 }}>
              {currentChapter.isColorMode ? "B&W" : "Colorize"}
            </span>
          </button>

          {/* Audio Controls */}
          {isAudioProcessing ? (
            <div
              className="glass-panel"
              style={{
                padding: "12px",
                color: "rgba(255,255,255,0.5)",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <Loader2 size={16} className="spinner" />
              <span style={{ fontSize: "0.8rem" }}>Generating Voice...</span>
            </div>
          ) : (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="glass-panel"
              disabled={!currentChapter.audio_url}
              style={{
                padding: "12px 24px",
                background: isMuted
                  ? "rgba(255, 170, 0, 0.2)"
                  : "rgba(255, 255, 255, 0.1)",
                border: isMuted
                  ? "1px solid rgba(255, 170, 0, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                color: "white",
                cursor: currentChapter.audio_url ? "pointer" : "not-allowed",
                opacity: currentChapter.audio_url ? 1 : 0.5,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.3s ease",
              }}
            >
              {isMuted ? (
                <Play size={20} fill="currentColor" />
              ) : (
                <Pause size={20} fill="currentColor" />
              )}
              <span style={{ fontWeight: 600 }}>
                {isMuted ? "Play" : "Pause"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Carousel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Previous Image */}
        <AnimatePresence>
          {currentChapterIndex > 0 && chapters[currentChapterIndex - 1] && (
            <motion.div
              key={`prev-${currentChapterIndex}`}
              initial={{ opacity: 0, x: -100, scale: 0.8 }}
              animate={{
                opacity: 0.4,
                x: -250,
                scale: 0.85,
                filter: "blur(4px)",
              }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ duration: 0.4 }}
              onClick={prevChapter}
              style={{
                position: "absolute",
                height: "60%",
                aspectRatio: "4/3",
                cursor: "pointer",
                borderRadius: "16px",
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              <img
                src={chapters[currentChapterIndex - 1].img_url}
                alt="Previous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  background: "#000",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Arrow */}
        <button
          onClick={prevChapter}
          disabled={currentChapterIndex === 0}
          style={{
            position: "absolute",
            left: "10%",
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            padding: "12px",
            color: "white",
            opacity: currentChapterIndex === 0 ? 0 : 1,
            cursor: "pointer",
            zIndex: 20,
          }}
        >
          <ChevronLeft size={32} />
        </button>

        {/* Current Image */}
        <motion.div
          key={currentChapter.id}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => currentChapter.img_url && setIsLightboxOpen(true)}
          style={{
            height: "65%",
            aspectRatio: "4/3",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            border: "4px solid rgba(255,255,255,0.1)",
            zIndex: 15,
            background: "#111",
            cursor: "zoom-in",
            position: "relative",
          }}
        >
          {currentChapter.img_url ? (
            <>
              <img
                src={currentChapter.img_url}
                alt={currentChapter.title}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  background: "#000",
                  transition: "opacity 0.4s ease",
                }}
              />

              <AnimatePresence>
                {currentChapter.isColorMode && currentChapter.colorized_url && (
                  <motion.img
                    key="colorized"
                    src={currentChapter.colorized_url}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: "#000",
                    }}
                  />
                )}
              </AnimatePresence>

              {isColorizing && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  <Loader2 size={40} className="spinner" color="white" />
                </div>
              )}

              <div
                className="hover-hint"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(0,0,0,0.6)",
                  borderRadius: "50%",
                  padding: "8px",
                  opacity: 0,
                  transition: "opacity 0.2s",
                  zIndex: 20,
                }}
              >
                <Maximize2 size={20} color="white" />
              </div>
            </>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#222",
              }}
            >
              <p style={{ color: "#666" }}>No Image</p>
            </div>
          )}
        </motion.div>
        <style>{`
                    .hover-hint { opacity: 0; }
                    div[style*="cursor: zoom-in"]:hover .hover-hint { opacity: 1 !important; }
                `}</style>

        {/* Right Arrow */}
        <button
          onClick={nextChapter}
          disabled={currentChapterIndex === chapters.length - 1}
          style={{
            position: "absolute",
            right: "10%",
            background: "rgba(0,0,0,0.5)",
            border: "none",
            borderRadius: "50%",
            padding: "12px",
            color: "white",
            opacity: currentChapterIndex === chapters.length - 1 ? 0 : 1,
            cursor: "pointer",
            zIndex: 20,
          }}
        >
          <ChevronRight size={32} />
        </button>

        {/* Next Image */}
        <AnimatePresence>
          {currentChapterIndex < chapters.length - 1 &&
            chapters[currentChapterIndex + 1] && (
              <motion.div
                key={`next-${currentChapterIndex}`}
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{
                  opacity: 0.4,
                  x: 250,
                  scale: 0.85,
                  filter: "blur(4px)",
                }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ duration: 0.4 }}
                onClick={nextChapter}
                style={{
                  position: "absolute",
                  height: "60%",
                  aspectRatio: "4/3",
                  cursor: "pointer",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              >
                <img
                  src={chapters[currentChapterIndex + 1].img_url}
                  alt="Next"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#000",
                  }}
                />
              </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Footer: Description & Date */}
      <div
        style={{
          padding: "0 48px 20px",
          zIndex: 10,
          textAlign: "center",
          background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
          maxHeight: "40vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "-20px",
        }}
      >
        <div
          style={{
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.6)",
            marginBottom: "4px",
            fontWeight: 500,
            letterSpacing: "1px",
          }}
        >
          {currentChapter.date}
        </div>

        <motion.div
          key={currentChapter.text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel custom-scrollbar"
          style={{
            maxWidth: "1000px",
            width: "90vw",
            margin: "0 auto",
            padding: "16px 24px",
            fontSize: "1rem",
            color: "#ddd",
            lineHeight: 1.6,
            overflowY: "auto",
            maxHeight: "100%",
          }}
        >
          {currentChapter.text}
        </motion.div>

        {/* Progress Bar */}
        <div
          style={{
            marginTop: "12px",
            width: "100%",
            maxWidth: "800px",
            margin: "12px auto 0",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "4px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "2px",
              overflow: "hidden",
              opacity: audioProgress > 0 && isPlaying ? 1 : 0,
              transition: "opacity 0.3s",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${audioProgress * 100}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
              style={{
                height: "100%",
                background: "#ffaa00",
              }}
            />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && currentChapter.img_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.95)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
            }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "50%",
                padding: "12px",
                color: "white",
                cursor: "pointer",
                zIndex: 110,
              }}
            >
              <X size={32} />
            </button>

            <motion.img
              src={
                currentChapter.isColorMode && currentChapter.colorized_url
                  ? currentChapter.colorized_url
                  : currentChapter.img_url
              }
              alt={currentChapter.title}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "4px",
                boxShadow: "0 0 50px rgba(0,0,0,0.5)",
                cursor: "default",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
