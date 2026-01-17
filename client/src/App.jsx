import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Journey from './pages/Journey';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/journey/:id" element={<Journey />} />
      </Routes>
    </Router>
  );
}

export default App;
