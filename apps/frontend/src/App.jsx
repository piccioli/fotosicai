import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import MapPage from './pages/MapPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import PhotoDetailPage from './pages/PhotoDetailPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <header className="app-header">
        <img className="app-header__logo" src="/logo-sicai.png" alt="SICAI" />
        <span className="app-header__title">FotoSICAI</span>
        <nav className="app-header__nav">
          <NavLink to="/" end>Mappa</NavLink>
          <NavLink to="/upload">Carica foto</NavLink>
          <NavLink to="/search">Cerca</NavLink>
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
    </BrowserRouter>
  );
}
