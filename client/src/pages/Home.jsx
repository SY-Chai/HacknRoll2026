import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  ArrowRight,
  Clock,
  History,
  Sparkles,
} from "lucide-react";
import SceneViewer from "../components/SceneViewer";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([1900, 2026]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
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
      const newRecent = [
        query,
        ...recentSearches.filter((s) => s !== query),
      ].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem("recentSearches", JSON.stringify(newRecent));

      // Fetch from backend (New Journal API)
      const response = await fetch("/api/journal/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          startYear: dateRange[0].toString(),
          endYear: dateRange[1].toString(),
        }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();

      // Navigate to Journey with ID
      if (data.success && data.journalId) {
        navigate(`/journey/${data.journalId}`);
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
    <div
      className="full-screen"
      style={{ position: "relative", overflowY: "auto", overflowX: "hidden" }}
    >
      {/* Background 3D Scene */}
      <SceneViewer visualFocus="default" />

      {/* Dark Overlay for Contrast */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at center, rgba(10,10,15,0.4) 0%, rgba(10,10,15,0.8) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        className="container"
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: "100px", // Visual balance
        }}
      >
        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: "60px" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "16px",
              padding: "6px 16px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Sparkles size={16} color="#FFD700" />
            <span
              style={{
                fontSize: "0.85rem",
                color: "#eee",
                letterSpacing: "0.5px",
              }}
            >
              Explore Singapore's History
            </span>
          </div>

          <h1
            className="glow-text"
            style={{
              fontSize: "clamp(3rem, 6vw, 5rem)",
              fontWeight: 300,
              margin: 0,
              letterSpacing: "-2px",
              lineHeight: 1.1,
            }}
          >
            Rewind <span style={{ fontWeight: 700, color: "#fff" }}>SG</span>
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "rgba(255,255,255,0.7)",
              maxWidth: "500px",
              margin: "16px auto 0",
              lineHeight: 1.6,
            }}
          >
            Journey through the decades. Uncover the stories of the past with a
            single search.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          onSubmit={handleSearchSubmit}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "650px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              padding: "8px",
              borderRadius: "50px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(20, 20, 25, 0.6)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              transition: "all 0.3s ease",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search color="rgba(255,255,255,0.5)" size={24} />
            </div>

            <input
              type="text"
              placeholder="Try searching 'Chinatown'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "1.2rem",
                outline: "none",
                padding: "8px 0",
              }}
            />

            <button
              type="submit"
              style={{
                background: "var(--text-main)", // White
                color: "var(--bg-dark)",
                borderRadius: "50px",
                padding: "12px 32px",
                fontWeight: 600,
                fontSize: "1rem",
                transition: "transform 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              {isLoading ? (
                <div
                  className="spinner"
                  style={{
                    width: 18,
                    height: 18,
                    border: "2px solid rgba(0,0,0,0.1)",
                    borderTop: "2px solid black",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <>
                  Search <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Year Range Slider */}
          <div style={{ w: "90%", width: "90%", padding: "0 10px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.85rem",
                marginBottom: "8px",
              }}
            >
              <span>{dateRange[0]}</span>
              <span>Year Range</span>
              <span>{dateRange[1]}</span>
            </div>
            <Slider
              range
              min={1800}
              max={2026}
              defaultValue={[1900, 2026]}
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              trackStyle={[{ backgroundColor: "var(--text-main)", height: 4 }]}
              handleStyle={[
                {
                  borderColor: "var(--text-main)",
                  backgroundColor: "var(--text-main)",
                  opacity: 1,
                },
                {
                  borderColor: "var(--text-main)",
                  backgroundColor: "var(--text-main)",
                  opacity: 1,
                },
              ]}
              railStyle={{
                backgroundColor: "rgba(255,255,255,0.2)",
                height: 4,
              }}
            />
          </div>
        </motion.form>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: "24px", display: "flex", gap: "12px" }}
        >
          <button
            onClick={() => navigate("/memories")}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              color: "white",
              borderRadius: "30px",
              padding: "10px 24px",
              fontSize: "0.95rem",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <Sparkles size={18} />
            Create Journal
          </button>

          <button
            onClick={() => navigate("/saved")}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              color: "white",
              borderRadius: "30px",
              padding: "10px 24px",
              fontSize: "0.95rem",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <History size={18} />
            Saved Journals
          </button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              color: "#ff6b6b",
              marginTop: "20px",
              background: "rgba(255,0,0,0.1)",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(255,0,0,0.2)",
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Recent Searches */}
        {!isLoading && recentSearches.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              marginTop: "40px",
              width: "100%",
              maxWidth: "650px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.9rem",
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Recent Discoveries
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              {recentSearches.map((term, i) => (
                <motion.button
                  key={i}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(255,255,255,0.1)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchTerm(term);
                    performSearch(term);
                  }}
                  style={{
                    padding: "8px 20px",
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.8)",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "30px",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                >
                  <span style={{ opacity: 0.5, marginRight: "6px" }}>#</span>
                  {term}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
