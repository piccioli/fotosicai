import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Exifr from 'exifr';
import { api } from '../lib/api.js';
import LocationPicker from '../components/LocationPicker.jsx';
import ConsentText from '../components/ConsentText.jsx';
import PhotoMeta from '../components/PhotoMeta.jsx';

function IconExpand() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  );
}

function IconCompress() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
      <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
    </svg>
  );
}

const STEPS = ['1. File', '2. Posizione', '3. Titolo & AI', '4. Consenso', '5. Conferma'];
const ITALY_CENTER = { lat: 42.5, lng: 12.5 };

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [exifGps, setExifGps] = useState(null);
  const [exifDatetime, setExifDatetime] = useState(null);
  const [exifGeoInfo, setExifGeoInfo] = useState(null); // {regione, provincia, comune}
  const [exifStage, setExifStage] = useState(undefined); // {stage_ref, distance_m} | null | undefined(loading)
  const [autoreName, setAutoreName] = useState(() => localStorage.getItem('fotosicai_autore') || '');
  const [rememberName, setRememberName] = useState(() => !!localStorage.getItem('fotosicai_autore'));
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
  const [mapFullscreen, setMapFullscreen] = useState(false);

  // Step 0: pick file
  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
    setExifGps(null);
    setExifGeoInfo(null);
    setExifStage(undefined);
    // Parse EXIF client-side for GPS preview
    try {
      const data = await Exifr.parse(f, { gps: true });
      if (data?.latitude && data?.longitude) {
        const gps = { lat: data.latitude, lng: data.longitude };
        setExifGps(gps);
        setPosition(gps);
        // Reverse geocode + tappa SICAI in parallelo
        fetch(`/api/geocode?lat=${gps.lat}&lng=${gps.lng}`)
          .then((r) => r.ok ? r.json() : null)
          .then((geo) => { if (geo) setExifGeoInfo(geo); })
          .catch(() => {});

        fetch(`/api/stages/nearest?lat=${gps.lat}&lng=${gps.lng}`)
          .then((r) => r.ok ? r.json() : null)
          .then((s) => setExifStage(s))
          .catch(() => setExifStage(null));
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

  function handlePositionChange(pos) {
    setPosition(pos);
    setExifGeoInfo(null);
    setExifStage(undefined);
    fetch(`/api/geocode?lat=${pos.lat}&lng=${pos.lng}`)
      .then((r) => r.ok ? r.json() : null)
      .then((geo) => { if (geo) setExifGeoInfo(geo); })
      .catch(() => {});
    fetch(`/api/stages/nearest?lat=${pos.lat}&lng=${pos.lng}`)
      .then((r) => r.ok ? r.json() : null)
      .then((s) => setExifStage(s))
      .catch(() => setExifStage(null));
  }

  const withinThreshold = exifStage === undefined || exifStage === null || !!exifStage?.stage_ref;

  const canProceedStep0 = !!file && autoreName.trim().length > 0;
  const canProceedStep1 = !!position && withinThreshold;

  return (
    <div className="upload-page">
      <h1>Carica una foto</h1>
      <StepIndicator current={step} steps={STEPS} />

      {error && <div style={{ background: '#fce8e8', border: '1px solid #e00', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#a00' }}>{error}</div>}

      {/* STEP 0 — Pick file */}
      {step === 0 && (
        <div className="step-card">
          <h2>1. Seleziona la foto</h2>
          <div className="field">
            <label>Foto (JPEG, PNG, WEBP – max 50 MB)</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          {previewUrl && <img className="preview-img" src={previewUrl} alt="Anteprima" />}
          {exifGps && (
            <div style={{ marginTop: 12 }}>
              <PositionMeta position={exifGps} exifGeoInfo={exifGeoInfo} exifStage={exifStage} />
            </div>
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
          <div className="checkbox-row" style={{ marginBottom: 4 }}>
            <input
              type="checkbox"
              id="remember-name"
              checked={rememberName}
              onChange={(e) => setRememberName(e.target.checked)}
            />
            <label htmlFor="remember-name" style={{ fontSize: 13, color: '#555' }}>
              Ricorda il mio nome per i prossimi caricamenti
            </label>
          </div>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              disabled={!canProceedStep0}
              onClick={() => {
                if (rememberName) localStorage.setItem('fotosicai_autore', autoreName.trim());
                else localStorage.removeItem('fotosicai_autore');
                setStep(1);
              }}
            >
              Avanti
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 — Position */}
      {step === 1 && (
        <div className="step-card">
          <h2>2. Posizione della foto</h2>
          {exifGps ? (
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              <span className="tag success">Posizione da GPS EXIF</span> — puoi spostarla trascinando il marker.
            </p>
          ) : (
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              <span className="tag warning">Nessun GPS nella foto</span> — clicca sulla mappa o trascina il marker per indicare dove è stata scattata.
            </p>
          )}

          {/* Map wrapper — diventa fullscreen overlay */}
          <div className={mapFullscreen ? 'map-outer map-outer--fullscreen' : 'map-outer'}>
            <LocationPicker
              initialPosition={position || ITALY_CENTER}
              onChange={handlePositionChange}
              withinThreshold={withinThreshold}
              fullscreen={mapFullscreen}
            />

            {/* Toggle fullscreen button */}
            <button
              className="map-fullscreen-toggle"
              title={mapFullscreen ? 'Vista normale' : 'Schermo intero'}
              onClick={() => setMapFullscreen((v) => !v)}
            >
              {mapFullscreen ? <IconCompress /> : <IconExpand />}
            </button>

            {/* In fullscreen: pannello fisso in basso con info + bottoni */}
            {mapFullscreen && (
              <div className="map-fullscreen-panel">
                <div className="map-fullscreen-info">
                  <PositionMeta position={position} exifGeoInfo={exifGeoInfo} exifStage={exifStage} />
                </div>
                <div className="btn-row" style={{ margin: 0, flexShrink: 0 }}>
                  <button className="btn btn-secondary" onClick={() => setStep(0)}>Indietro</button>
                  <button className="btn btn-primary" disabled={!canProceedStep1 || submitting} onClick={handleUploadDraft}>
                    {submitting ? <span className="loading-dots">Caricamento</span> : 'Avanti'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* In vista normale: info e bottoni sotto la mappa */}
          {!mapFullscreen && (
            <>
              {position && (
                <div style={{ marginTop: 12 }}>
                  <PositionMeta position={position} exifGeoInfo={exifGeoInfo} exifStage={exifStage} />
                </div>
              )}
              <div className="btn-row">
                <button className="btn btn-secondary" onClick={() => setStep(0)}>Indietro</button>
                <button className="btn btn-primary" disabled={!canProceedStep1 || submitting} onClick={handleUploadDraft}>
                  {submitting ? <span className="loading-dots">Caricamento</span> : 'Avanti'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 2 — Title & AI */}
      {step === 2 && (
        <div className="step-card">
          <h2>3. Titolo e descrizione</h2>

          {/* Photo preview + metadata summary */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
            <img
              src={draft?.paths?.thumb_url || previewUrl}
              alt="Anteprima"
              style={{ width: 110, height: 82, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid #eee', background: '#000' }}
            />
            <PhotoMeta
              autoreName={autoreName}
              dataScatto={exifDatetime}
              stageRef={draft?.suggested?.stage?.stage_ref}
              distanceM={draft?.suggested?.stage?.distance_m}
              lat={position?.lat}
              lng={position?.lng}
              regione={draft?.suggested?.regione}
              provincia={draft?.suggested?.provincia}
              comune={draft?.suggested?.comune}
            />
          </div>

          {aiLoading && (
            <div className="ai-loading-block">
              <div className="ai-loading-spinner" />
              <p className="ai-loading-label">Il motore AI Claude sta analizzando la foto…</p>
              <p className="ai-loading-sub">Generazione di titolo e descrizione in corso, potrai modificarli a tuo piacimento</p>
            </div>
          )}

          {!aiLoading && (
            <>
              {aiError && (
                <div className="ai-error-block">
                  AI non disponibile — inserisci titolo e descrizione manualmente.
                </div>
              )}
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
            </>
          )}
        </div>
      )}

      {/* STEP 3 — Consent */}
      {step === 3 && (
        <div className="step-card">
          <h2>4. Consenso</h2>
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
          <h2>5. Riepilogo e conferma</h2>
          {previewUrl && <img className="preview-img" src={previewUrl} alt="Anteprima" style={{ maxHeight: 200, marginBottom: 16 }} />}
          <PhotoMeta
            titolo={titolo}
            caption={caption}
            autoreName={autoreName}
            dataScatto={exifDatetime}
            stageRef={draft?.suggested?.stage?.stage_ref}
            distanceM={draft?.suggested?.stage?.distance_m}
            lat={position?.lat}
            lng={position?.lng}
            regione={draft?.suggested?.regione}
            provincia={draft?.suggested?.provincia}
            comune={draft?.suggested?.comune}
          />
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

function PositionMeta({ position, exifGeoInfo, exifStage }) {
  const withinThreshold = exifStage === undefined || exifStage === null || !!exifStage?.stage_ref;
  return (
    <>
      <PhotoMeta
        stageRef={exifStage?.stage_ref}
        distanceM={exifStage?.distance_m}
        lat={position?.lat}
        lng={position?.lng}
        regione={exifGeoInfo?.regione}
        provincia={exifGeoInfo?.provincia}
        comune={exifGeoInfo?.comune}
      />
      {exifStage !== undefined && !withinThreshold && (
        <p style={{ marginTop: 8, fontSize: 13 }}>
          <span className="tag warning">
            Nessuna tappa SICAI nel raggio di {Math.round(Number(import.meta.env.VITE_STAGE_MAX_DISTANCE_M || 5000) / 1000)} km — sposta il marker nei pressi del Sentiero Italia.
          </span>
        </p>
      )}
    </>
  );
}

function StepIndicator({ current, steps }) {
  return (
    <div className="step-indicator">
      {steps.map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div className={`step-indicator__line ${i <= current ? 'done' : ''}`} />}
          <div className={`step-indicator__dot ${i < current ? 'done' : i === current ? 'active' : ''}`}>
            {i + 1}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
