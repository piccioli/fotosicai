import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import MapPage from './pages/MapPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import PhotoDetailPage from './pages/PhotoDetailPage.jsx';

/* ── SVG icons ─────────────────────────────────────────────────────────── */

function IconMap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="8.5" strokeWidth="2.5"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  );
}

/* ── Info popup ────────────────────────────────────────────────────────── */

function InfoPopup({ onClose }) {
  return (
    <div className="info-overlay" onClick={onClose}>
      <div className="info-popup" onClick={(e) => e.stopPropagation()}>
        <button className="info-popup__close" onClick={onClose} aria-label="Chiudi">×</button>
        <img src="/logo-sicai.png" alt="SICAI" style={{ height: 48, marginBottom: 12 }} />
        <h2 style={{ fontSize: '1.1rem', marginBottom: 6 }}>FotoSICAI</h2>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>
          Piattaforma fotografica del <strong>Sentiero Italia CAI</strong> —
          il sentiero escursionistico più lungo d'Italia, oltre 7.000 km da Trieste
          a Santa Teresa Gallura.
        </p>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
          Carica le tue foto georeferenziate lungo il tracciato, arricchiscile con
          titolo e descrizione generati da intelligenza artificiale, e contribuisci
          alla memoria visiva del Sentiero Italia.
        </p>
        <div style={{ fontSize: 12, color: '#888', borderTop: '1px solid #eee', paddingTop: 12 }}>
          Sviluppato per <strong>Montagna Servizi / SICAI</strong>
        </div>
      </div>
    </div>
  );
}

/* ── App ───────────────────────────────────────────────────────────────── */

export default function App() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <BrowserRouter>
      <header className="app-header">
        <img className="app-header__logo" src="/logo-sicai.png" alt="SICAI" />
        <span className="app-header__title">FotoSICAI</span>
        <nav className="app-header__nav">
          <NavLink to="/" end title="Mappa"><IconMap /></NavLink>
          <NavLink to="/search" title="Cerca"><IconSearch /></NavLink>
          <NavLink to="/upload" title="Carica foto"><IconUpload /></NavLink>
          <button className="nav-icon-btn" title="Info sull'app" onClick={() => setShowInfo(true)}>
            <IconInfo />
          </button>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/foto/:id" element={<PhotoDetailPage />} />
        </Routes>
      </main>

      {showInfo && <InfoPopup onClose={() => setShowInfo(false)} />}
    </BrowserRouter>
  );
}
