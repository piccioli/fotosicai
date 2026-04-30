import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Exifr from 'exifr';
import { api } from '../lib/api.js';
import LocationPicker from '../components/LocationPicker.jsx';
import ConsentText from '../components/ConsentText.jsx';

const STEPS = ['File', 'Posizione', 'Titolo & AI', 'Consenso', 'Conferma'];
const ITALY_CENTER = { lat: 42.5, lng: 12.5 };

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [exifGps, setExifGps] = useState(null);
  const [exifDatetime, setExifDatetime] = useState(null);
  const [autoreName, setAutoreName] = useState('');
  const [position, setPosition] = useState(null); // {lat, lng}
  const [draft, setDraft] = useState(null); // response from POST /api/upload
  const [titolo, setTitolo] = useState('');
  const [caption, setCaption] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [consent, setConsent] = useState(null); // {version, markdown}
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Step 0: pick file
  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
    // Parse EXIF client-side for GPS preview
    try {
      const data = await Exifr.parse(f, { gps: true });
      if (data?.latitude && data?.longitude) {
        setExifGps({ lat: data.latitude, lng: data.longitude });
        setPosition({ lat: data.latitude, lng: data.longitude });
      }
      if (data?.DateTimeOriginal) {
        const raw = String(data.DateTimeOriginal);
        setExifDatetime(raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
      }
    } catch {}
  }

  // Step 1 → 2: upload file to server
  async function handleUploadDraft() {
    if (!file) return;
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('autore_nome', autoreName.trim() || 'Anonimo');
      if (position) {
        fd.append('lat', position.lat);
        fd.append('lng', position.lng);
      }
      const data = await api.upload(fd);
      setDraft(data);
      if (data.suggested?.lat != null) {
        setPosition({ lat: data.suggested.lat, lng: data.suggested.lng });
      }
      setStep(2);
      // Auto-trigger AI
      triggerAI(data.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function triggerAI(draftId) {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await api.generateAI(draftId);
      setTitolo(result.titolo || '');
      setCaption(result.caption || '');
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  // Load consent when entering step 3
  useEffect(() => {
    if (step === 3 && !consent) {
      api.getConsent().then(setConsent).catch(() => {});
    }
  }, [step]);

  async function handleFinalize() {
    if (!consentAccepted) { setError('Devi accettare il consenso'); return; }
    if (!titolo.trim()) { setError('Il titolo è obbligatorio'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.finalize(draft.id, {
        titolo: titolo.trim(),
        caption: caption.trim(),
        autore_nome: autoreName.trim() || 'Anonimo',
        lat: position?.lat,
        lng: position?.lng,
        consenso_version: consent?.version || '',
        consenso_accepted: true,
        ai_generated: !aiError && !!titolo,
      });
      navigate(`/?photo=${result.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const canProceedStep0 = !!file && autoreName.trim().length > 0;
  const canProceedStep1 = !!position;

  return (
    <div className="upload-page">
      <h1>Carica una foto</h1>
      <StepIndicator current={step} total={STEPS.length} />

      {error && <div style={{ background: '#fce8e8', border: '1px solid #e00', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#a00' }}>{error}</div>}

      {/* STEP 0 — Pick file */}
      {step === 0 && (
        <div className="step-card">
          <h2>Seleziona la foto</h2>
          <div className="field">
            <label>Foto (JPEG, PNG, WEBP – max 50 MB)</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          {previewUrl && <img className="preview-img" src={previewUrl} alt="Anteprima" />}
          {exifGps && (
            <p style={{ marginTop: 10, fontSize: 13 }}>
              <span className="tag success">GPS rilevato: {exifGps.lat.toFixed(5)}, {exifGps.lng.toFixed(5)}</span>
            </p>
          )}
          {!exifGps && file && (
            <p style={{ marginTop: 10, fontSize: 13 }}>
              <span className="tag warning">GPS non presente — potrai posizionare manualmente</span>
            </p>
          )}
          <div className="field" style={{ marginTop: 16 }}>
            <label>Il tuo nome / Autore *</label>
            <input type="text" placeholder="Nome Cognome" value={autoreName} onChange={(e) => setAutoreName(e.target.value)} maxLength={80} />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" disabled={!canProceedStep0} onClick={() => setStep(1)}>
              Avanti
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 — Position */}
      {step === 1 && (
        <div className="step-card">
          <h2>Posizione della foto</h2>
          {exifGps ? (
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              <span className="tag success">Posizione da GPS EXIF</span> — puoi spostarla trascinando il marker.
            </p>
          ) : (
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              <span className="tag warning">Nessun GPS nella foto</span> — clicca sulla mappa o trascina il marker per indicare dove è stata scattata.
            </p>
          )}
          <LocationPicker
            initialPosition={position || ITALY_CENTER}
            onChange={setPosition}
          />
          {position && (
            <p style={{ fontSize: 12, color: '#555', marginTop: 6 }}>
              Lat: {position.lat.toFixed(6)} · Lng: {position.lng.toFixed(6)}
            </p>
          )}
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(0)}>Indietro</button>
            <button className="btn btn-primary" disabled={!canProceedStep1 || submitting} onClick={handleUploadDraft}>
              {submitting ? <span className="loading-dots">Caricamento</span> : 'Carica e continua'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Title & AI */}
      {step === 2 && (
        <div className="step-card">
          <h2>Titolo e descrizione</h2>
          {draft?.suggested && (
            <div style={{ marginBottom: 14, fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {draft.suggested.stage?.stage_ref && <span className="tag">Tappa: {draft.suggested.stage.stage_ref}</span>}
              {draft.suggested.comune && <span className="tag">{draft.suggested.comune}</span>}
              {draft.suggested.regione && <span className="tag">{draft.suggested.regione}</span>}
            </div>
          )}
          {aiLoading && <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}><span className="loading-dots">Claude sta analizzando l'immagine</span></p>}
          {aiError && <p style={{ fontSize: 13, color: '#aa6600', marginBottom: 12 }}>AI non disponibile — inserisci titolo e descrizione manualmente.</p>}
          <div className="field">
            <label>Titolo * <span style={{ color: '#888', fontWeight: 400 }}>(max 60 caratteri)</span></label>
            <input type="text" value={titolo} onChange={(e) => setTitolo(e.target.value)} maxLength={60} placeholder="Titolo della foto..." />
            <div className="hint">{titolo.length}/60</div>
          </div>
          <div className="field">
            <label>Descrizione <span style={{ color: '#888', fontWeight: 400 }}>(max 280 caratteri)</span></label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={280} placeholder="Descrizione della foto..." />
            <div className="hint">{caption.length}/280</div>
          </div>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Indietro</button>
            <button className="btn btn-primary" disabled={!titolo.trim()} onClick={() => setStep(3)}>Avanti</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Consent */}
      {step === 3 && (
        <div className="step-card">
          <h2>Consenso</h2>
          {consent ? (
            <ConsentText markdown={consent.markdown} />
          ) : (
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}><span className="loading-dots">Caricamento</span></p>
          )}
          <div className="checkbox-row">
            <input type="checkbox" id="consent-check" checked={consentAccepted} onChange={(e) => setConsentAccepted(e.target.checked)} />
            <label htmlFor="consent-check">
              Ho letto e accetto il documento di consenso per l'utilizzo delle mie foto da parte di SICAI / Montagna Servizi.
            </label>
          </div>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>Indietro</button>
            <button className="btn btn-primary" disabled={!consentAccepted} onClick={() => setStep(4)}>Avanti</button>
          </div>
        </div>
      )}

      {/* STEP 4 — Confirm */}
      {step === 4 && (
        <div className="step-card">
          <h2>Riepilogo e conferma</h2>
          {previewUrl && <img className="preview-img" src={previewUrl} alt="Anteprima" style={{ maxHeight: 200 }} />}
          <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.7 }}>
            <p><strong>Titolo:</strong> {titolo}</p>
            {caption && <p><strong>Descrizione:</strong> {caption}</p>}
            <p><strong>Autore:</strong> {autoreName}</p>
            {position && <p><strong>Posizione:</strong> {position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>}
            {draft?.suggested?.stage?.stage_ref && <p><strong>Tappa SICAI:</strong> {draft.suggested.stage.stage_ref}</p>}
            {draft?.suggested?.comune && <p><strong>Comune:</strong> {draft.suggested.comune}, {draft.suggested.regione}</p>}
          </div>
          <div className="btn-row" style={{ marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={() => setStep(3)}>Indietro</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleFinalize}>
              {submitting ? <span className="loading-dots">Pubblicazione</span> : 'Pubblica foto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ current, total }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`step-indicator__dot ${i < current ? 'done' : i === current ? 'active' : ''}`} />
      ))}
    </div>
  );
}
