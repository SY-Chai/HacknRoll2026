import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Journey from './pages/Journey';
import Memories from './pages/Memories';
import SplatPage from './pages/SplatPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/journey/:id" element={<Journey />} />
        <Route path="/memories" element={<Memories />} />
        <Route path="/splat" element={<SplatPage />} />
      </Routes>
    </Router>
  );
}

export default App;
