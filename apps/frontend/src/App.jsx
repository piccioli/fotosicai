import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import MapPage from './pages/MapPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import VerifyPendingPage from './pages/VerifyPendingPage.jsx';
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
          il sentiero escursionistico più lungo d'Italia, oltre 8.000 km da Trieste
          a Santa Teresa Gallura.
        </p>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>
          Carica le tue foto georeferenziate lungo il tracciato, arricchiscile con
          titolo e descrizione generati da intelligenza artificiale, e contribuisci
          alla memoria visiva del Sentiero Italia.
        </p>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 16 }}>
          Le fotografie caricate vengono cedute al <strong>Club Alpino Italiano</strong> con
          licenza <strong>CC BY 4.0</strong>.
        </p>
        <div style={{ fontSize: 11, color: '#888', borderTop: '1px solid #eee', paddingTop: 12, lineHeight: 1.5 }}>
          Iniziativa realizzata da <strong>Montagna Servizi SCPA</strong> nell'ambito
          dell'affidamento di servizi per l'avvio dell'attuazione del Piano Progetto
          Sentiero Italia CAI — CIG B165634123 (2024–2026).
        </div>
        <div style={{ fontSize: 11, color: '#aaa', borderTop: '1px solid #eee', paddingTop: 10, marginTop: 8, lineHeight: 1.8 }}>
          <div>
            Software: FotoSICAI v{__APP_VERSION__}{' '}
            <span style={{
              display: 'inline-block', padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700,
              background: import.meta.env.VITE_APP_ENV === 'production' ? '#2e7d32' : '#e65100',
              color: '#fff', verticalAlign: 'middle', marginLeft: 2,
            }}>
              {import.meta.env.VITE_APP_ENV === 'production' ? 'PROD' : 'DEV'}
            </span>
          </div>
          <div>
            Licenza{' '}
            <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT</a>
            {' — '}
            <a href="https://github.com/piccioli/fotosicai" target="_blank" rel="noopener noreferrer">codice sorgente</a>
          </div>
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
          <Route path="/upload/pending" element={<VerifyPendingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/foto/:id" element={<PhotoDetailPage />} />
        </Routes>
      </main>

      {showInfo && <InfoPopup onClose={() => setShowInfo(false)} />}
    </BrowserRouter>
  );
}
