import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Exifr from 'exifr';
import { api } from '../lib/api.js';
import LocationPicker from '../components/LocationPicker.jsx';
import ConsentText from '../components/ConsentText.jsx';
import PhotoMeta from '../components/PhotoMeta.jsx';
import { CAI_SEZIONI } from '../lib/caiSezioni.js';

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

const STEPS = ['1. File', '2. Posizione', '3. Titolo & AI', '4. Riepilogo', '5. Pubblica'];
const ITALY_CENTER = { lat: 42.5, lng: 12.5 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let _uid = 0;

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const [autoreName, setAutoreName] = useState(() => localStorage.getItem('fotosicai_autore') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('fotosicai_email') || '');
  const [rememberData, setRememberData] = useState(
    () => !!(localStorage.getItem('fotosicai_autore') || localStorage.getItem('fotosicai_email'))
  );
  const [socioCai, setSocioCai] = useState(() => localStorage.getItem('fotosicai_socio') === '1');
  const [sezioneCai, setSezioneCai] = useState(() => localStorage.getItem('fotosicai_sezione') || '');
  const [ruoloCai, setRuoloCai] = useState(() => localStorage.getItem('fotosicai_ruolo') || '');
  const [referenteSicai, setReferenteSicai] = useState(() => localStorage.getItem('fotosicai_referente') === '1');
  const [referenteSicaiAmbito, setReferenteSicaiAmbito] = useState(
    () => localStorage.getItem('fotosicai_referente_ambito') || ''
  );
  const [consent, setConsent] = useState(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');
  const [error, setError] = useState(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);
  const [editingPhotoId, setEditingPhotoId] = useState(null);

  const cur = photos[currentPhotoIdx] ?? null;
  const withinThreshold = cur?.stage === undefined || cur?.stage === null || !!cur?.stage?.stage_ref;
  const canProceedStep0 = photos.length > 0 && autoreName.trim().length > 0 && EMAIL_RE.test(email.trim());
  const canProceedStep1 = !!cur?.position && withinThreshold;

  function updatePhotoById(id, updates) {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  async function parseExifAndGeo(photoId, file) {
    try {
      const data = await Exifr.parse(file, { gps: true });
      if (data?.latitude && data?.longitude) {
        const gps = { lat: data.latitude, lng: data.longitude };
        updatePhotoById(photoId, { exifGps: gps, position: gps, stage: undefined });
        fetch(`/api/geocode?lat=${gps.lat}&lng=${gps.lng}`)
          .then(r => r.ok ? r.json() : null)
          .then(geo => { if (geo) updatePhotoById(photoId, { geoInfo: geo }); })
          .catch(() => {});
        fetch(`/api/stages/nearest?lat=${gps.lat}&lng=${gps.lng}`)
          .then(r => r.ok ? r.json() : null)
          .then(s => updatePhotoById(photoId, { stage: s }))
          .catch(() => updatePhotoById(photoId, { stage: null }));
      }
      if (data?.DateTimeOriginal) {
        const raw = String(data.DateTimeOriginal);
        updatePhotoById(photoId, {
          exifDatetime: raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'),
        });
      }
    } catch {}
  }

  function processFiles(files) {
    if (!files.length) return;
    setError(null);
    const newPhotos = files.map(f => ({
      id: ++_uid,
      file: f,
      previewUrl: URL.createObjectURL(f),
      exifGps: null,
      exifDatetime: null,
      geoInfo: null,
      stage: undefined,
      draft: null,
      position: null,
      titolo: '',
      caption: '',
      aiLoading: false,
      aiError: null,
    }));
    setPhotos(prev => {
      prev.forEach(p => URL.revokeObjectURL(p.previewUrl));
      return newPhotos;
    });
    newPhotos.forEach(p => parseExifAndGeo(p.id, p.file));
  }

  function handleFileChange(e) {
    processFiles(Array.from(e.target.files || []));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (submitting) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    processFiles(files);
  }

  function removePhoto(id) {
    setPhotos(prev => {
      const p = prev.find(x => x.id === id);
      if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
      return prev.filter(x => x.id !== id);
    });
  }

  async function handleUploadAll() {
    if (!photos.length) return;
    setError(null);

    const needUpload = photos.filter(p => !p.draft);
    if (needUpload.length === 0) {
      setCurrentPhotoIdx(0);
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const results = await Promise.all(
        needUpload.map(async p => {
          const fd = new FormData();
          fd.append('file', p.file);
          fd.append('autore_nome', autoreName.trim() || 'Anonimo');
          fd.append('email', email.trim().toLowerCase());
          if (p.position) {
            fd.append('lat', p.position.lat);
            fd.append('lng', p.position.lng);
          }
          return { id: p.id, data: await api.upload(fd) };
        })
      );
      const resultMap = new Map(results.map(r => [r.id, r.data]));
      setPhotos(prev => prev.map(p => {
        const data = resultMap.get(p.id);
        if (!data) return p;
        const position = p.position ?? (
          data.suggested?.lat != null
            ? { lat: data.suggested.lat, lng: data.suggested.lng }
            : null
        );
        return { ...p, draft: data, position };
      }));
      setCurrentPhotoIdx(0);
      setStep(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handlePositionChange(pos) {
    if (!cur) return;
    const photoId = cur.id;
    updatePhotoById(photoId, { position: pos, geoInfo: null, stage: undefined });
    fetch(`/api/geocode?lat=${pos.lat}&lng=${pos.lng}`)
      .then(r => r.ok ? r.json() : null)
      .then(geo => { if (geo) updatePhotoById(photoId, { geoInfo: geo }); })
      .catch(() => {});
    fetch(`/api/stages/nearest?lat=${pos.lat}&lng=${pos.lng}`)
      .then(r => r.ok ? r.json() : null)
      .then(s => updatePhotoById(photoId, { stage: s }))
      .catch(() => updatePhotoById(photoId, { stage: null }));
  }

  useEffect(() => {
    if (step !== 2) return;
    const p = photos[currentPhotoIdx];
    if (!p || p.titolo || p.aiLoading || !p.draft?.id) return;
    const photoId = p.id;
    const draftId = p.draft.id;
    updatePhotoById(photoId, { aiLoading: true, aiError: null });
    api.generateAI(draftId)
      .then(r => updatePhotoById(photoId, { titolo: r.titolo || '', caption: r.caption || '', aiLoading: false }))
      .catch(e => updatePhotoById(photoId, { aiError: e.message, aiLoading: false }));
  }, [step, currentPhotoIdx]); // photos intentionally omitted — only trigger on step/photo navigation

  useEffect(() => {
    if (step >= 3 && !consent) {
      api.getConsent().then(setConsent).catch(() => {});
    }
  }, [step]);

  async function handleFinalize() {
    if (!consentAccepted) { setError('Devi accettare tutti i consensi obbligatori'); return; }
    const badIdx = photos.findIndex(p => !p.titolo.trim());
    if (badIdx !== -1) {
      setError(`Il titolo è obbligatorio${photos.length > 1 ? ` per tutte le foto (mancante nella foto ${badIdx + 1})` : ''}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    let firstResult = null;
    let i = 0;
    try {
      for (i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (photos.length > 1) setSubmitProgress(`Pubblicazione ${i + 1} di ${photos.length}…`);
        const result = await api.finalize(p.draft.id, {
          titolo: p.titolo.trim(),
          caption: p.caption.trim(),
          autore_nome: autoreName.trim() || 'Anonimo',
          lat: p.position?.lat,
          lng: p.position?.lng,
          consenso_version: consent?.version || '',
          consenso_accepted: true,
          ai_generated: !p.aiError && !!p.titolo,
          socio_cai: socioCai,
          sezione_cai: socioCai ? sezioneCai : '',
          ruolo_cai: ruoloCai,
          referente_sicai: referenteSicai,
          referente_sicai_ambito: referenteSicai ? referenteSicaiAmbito : '',
          marketing_consent: marketingConsent,
        });
        if (!firstResult) firstResult = result;
      }
      if (firstResult?.published) {
        setPublishedCount(photos.length);
      } else {
        navigate(
          `/upload/pending?email=${encodeURIComponent(firstResult.email)}&email_sent=${firstResult.email_sent !== false}&count=${photos.length}`
        );
      }
    } catch (e) {
      const suffix = photos.length > 1 ? ` (foto ${i + 1} di ${photos.length})` : '';
      setError(e.message + suffix);
    } finally {
      setSubmitting(false);
      setSubmitProgress('');
    }
  }

  if (publishedCount > 0) {
    return (
      <div className="upload-page">
        <div className="step-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ marginBottom: 12 }}>
            {publishedCount === 1 ? 'Grazie per la tua foto!' : `Grazie per le tue ${publishedCount} foto!`}
          </h2>
          <p style={{ fontSize: 15, color: '#333', lineHeight: 1.6, marginBottom: 10 }}>
            Grazie per aver contribuito all'archivio fotografico del <strong>Sentiero Italia CAI</strong>.
          </p>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 24 }}>
            {publishedCount === 1
              ? 'La tua foto è stata ricevuta ed è ora in attesa di approvazione da parte del team SICAI. Non appena approvata, sarà visibile sulla mappa e nell\'archivio pubblico.'
              : `Le tue ${publishedCount} foto sono state ricevute e sono ora in attesa di approvazione da parte del team SICAI. Non appena approvate, saranno visibili sulla mappa e nell'archivio pubblico.`}
          </p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => {
              setPublishedCount(0); setStep(0); setPhotos([]); setCurrentPhotoIdx(0);
              setConsentAccepted(false); setMarketingConsent(false);
            }}>
              Carica altre foto
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Torna alla mappa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <h1>Carica foto</h1>
      <StepIndicator current={step} steps={STEPS} />

      {error && (
        <div style={{ background: '#fce8e8', border: '1px solid #e00', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13, color: '#a00' }}>
          {error}
        </div>
      )}

      {/* STEP 0 — File selection */}
      {step === 0 && (
        <div className="step-card">
          <h2>1. Seleziona le foto</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={submitting}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div
            className={`file-drop-zone${dragOver ? ' file-drop-zone--over' : ''}`}
            onClick={() => !submitting && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); if (!submitting) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="file-drop-zone__icon">🖼️</div>
            <p className="file-drop-zone__text">
              {dragOver
                ? 'Rilascia le foto qui'
                : 'Trascina le foto qui oppure'}
            </p>
            {!dragOver && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ pointerEvents: 'none' }}
              >
                Sfoglia file…
              </button>
            )}
            <p className="file-drop-zone__hint">JPEG, PNG, WEBP · max 50 MB per foto · più file contemporaneamente</p>
          </div>

          {photos.length > 0 && (
            <>
              <div className="photo-thumb-grid">
                {photos.map(p => (
                  <div className="photo-thumb" key={p.id}>
                    <img src={p.previewUrl} alt={p.file.name} />
                    <GpsBadge exifGps={p.exifGps} stage={p.stage} />
                    <button className="photo-thumb__remove" disabled={submitting} onClick={() => removePhoto(p.id)} title="Rimuovi">✕</button>
                    <div className="photo-thumb__name">{p.file.name}</div>
                  </div>
                ))}
              </div>
              <div className="gps-legend">
                <div className="gps-legend__item">
                  <span className="gps-legend__dot gps-legend__dot--ok" />
                  <span><strong>GPS sul sentiero</strong> — posizione e tappa verranno arricchite automaticamente; la foto sarà poi revisionata dal team SICAI.</span>
                </div>
                <div className="gps-legend__item">
                  <span className="gps-legend__dot gps-legend__dot--offtrail" />
                  <span><strong>GPS fuori dal Sentiero Italia</strong> — i dati di posizione dovranno essere inseriti manualmente nel passo successivo.</span>
                </div>
                <div className="gps-legend__item">
                  <span className="gps-legend__dot gps-legend__dot--nogps" />
                  <span><strong>Nessun GPS</strong> — la posizione dovrà essere indicata manualmente sulla mappa nel passo successivo.</span>
                </div>
              </div>
            </>
          )}

          <div className="field" style={{ marginTop: 16 }}>
            <label>Il tuo nome / Autore *</label>
            <input type="text" placeholder="Nome Cognome" value={autoreName} onChange={(e) => setAutoreName(e.target.value)} maxLength={80} />
          </div>
          <div className="field">
            <label>La tua email *</label>
            <input
              type="email"
              placeholder="nome@esempio.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
            />
            <div className="hint" style={{ color: '#888' }}>
              Riceverai un link per confermare la tua email. Dopo la conferma, le foto verranno sottoposte a validazione da parte di un amministratore prima di essere pubblicate.
            </div>
          </div>

          <div className="checkbox-row" style={{ marginTop: 16 }}>
            <input type="checkbox" id="socio-cai" checked={socioCai} onChange={(e) => {
              setSocioCai(e.target.checked);
              if (!e.target.checked) { setReferenteSicai(false); setReferenteSicaiAmbito(''); }
            }} />
            <label htmlFor="socio-cai" style={{ fontWeight: 500 }}>Sono socio CAI</label>
          </div>
          {socioCai && (
            <div style={{ marginLeft: 24, marginTop: 8 }}>
              <div className="field" style={{ marginBottom: 10 }}>
                <label>Sezione CAI</label>
                <input
                  type="text"
                  list="cai-sezioni-list"
                  placeholder="Inizia a digitare la sezione…"
                  value={sezioneCai}
                  onChange={(e) => setSezioneCai(e.target.value)}
                  maxLength={120}
                />
                <datalist id="cai-sezioni-list">
                  {CAI_SEZIONI.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Ruolo / Titolo nel CAI <span style={{ color: '#888', fontWeight: 400 }}>(opzionale)</span></label>
                <input
                  type="text"
                  placeholder="es. Presidente di Sezione, Istruttore, …"
                  value={ruoloCai}
                  onChange={(e) => setRuoloCai(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>
          )}
          {socioCai && (
            <div className="checkbox-row" style={{ marginTop: 12 }}>
              <input type="checkbox" id="referente-sicai" checked={referenteSicai} onChange={(e) => setReferenteSicai(e.target.checked)} />
              <label htmlFor="referente-sicai" style={{ fontWeight: 500 }}>Sono referente SICAI di tappa / regionale</label>
            </div>
          )}
          {referenteSicai && (
            <div style={{ marginLeft: 24, marginTop: 8 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Regione o Tappa di riferimento</label>
                <input
                  type="text"
                  placeholder="es. Toscana, Tappa SI-01…"
                  value={referenteSicaiAmbito}
                  onChange={(e) => setReferenteSicaiAmbito(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>
          )}

          <div className="checkbox-row" style={{ marginBottom: 4, marginTop: 16 }}>
            <input
              type="checkbox"
              id="remember-data"
              checked={rememberData}
              onChange={(e) => {
                setRememberData(e.target.checked);
                if (!e.target.checked) {
                  ['fotosicai_autore', 'fotosicai_email', 'fotosicai_socio', 'fotosicai_sezione',
                   'fotosicai_ruolo', 'fotosicai_referente', 'fotosicai_referente_ambito']
                    .forEach(k => localStorage.removeItem(k));
                }
              }}
            />
            <label htmlFor="remember-data" style={{ fontSize: 13, color: '#555' }}>
              Ricorda i miei dati per i prossimi caricamenti
            </label>
          </div>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              disabled={!canProceedStep0 || submitting}
              onClick={() => {
                if (rememberData) {
                  localStorage.setItem('fotosicai_autore', autoreName.trim());
                  localStorage.setItem('fotosicai_email', email.trim().toLowerCase());
                  localStorage.setItem('fotosicai_socio', socioCai ? '1' : '0');
                  localStorage.setItem('fotosicai_sezione', sezioneCai);
                  localStorage.setItem('fotosicai_ruolo', ruoloCai);
                  localStorage.setItem('fotosicai_referente', referenteSicai ? '1' : '0');
                  localStorage.setItem('fotosicai_referente_ambito', referenteSicaiAmbito);
                } else {
                  ['fotosicai_autore', 'fotosicai_email', 'fotosicai_socio', 'fotosicai_sezione',
                   'fotosicai_ruolo', 'fotosicai_referente', 'fotosicai_referente_ambito']
                    .forEach(k => localStorage.removeItem(k));
                }
                handleUploadAll();
              }}
            >
              {submitting ? <span className="loading-dots">Caricamento</span> : 'Avanti'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 — Position */}
      {step === 1 && cur && (
        <div className="step-card">
          <h2>2. Posizione della foto</h2>

          {photos.length > 1 && (
            <div className="photo-progress-badge">
              <img src={cur.previewUrl} alt="" />
              <span className="tag">Foto {currentPhotoIdx + 1} di {photos.length}: {cur.file.name}</span>
            </div>
          )}

          {cur.exifGps ? (
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              <span className="tag success">Posizione da GPS EXIF</span> — puoi spostarla trascinando il marker.
            </p>
          ) : (
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              <span className="tag warning">Nessun GPS nella foto</span> — clicca sulla mappa o trascina il marker per indicare dove è stata scattata.
            </p>
          )}

          <div className={mapFullscreen ? 'map-outer map-outer--fullscreen' : 'map-outer'}>
            <LocationPicker
              initialPosition={cur.position || ITALY_CENTER}
              onChange={handlePositionChange}
              withinThreshold={withinThreshold}
              fullscreen={mapFullscreen}
            />
            <button
              className="map-fullscreen-toggle"
              title={mapFullscreen ? 'Vista normale' : 'Schermo intero'}
              onClick={() => setMapFullscreen(v => !v)}
            >
              {mapFullscreen ? <IconCompress /> : <IconExpand />}
            </button>

            {mapFullscreen && (
              <div className="map-fullscreen-panel">
                <div className="map-fullscreen-info">
                  <PositionMeta position={cur.position} geoInfo={cur.geoInfo} stage={cur.stage} />
                </div>
                <div className="btn-row" style={{ margin: 0, flexShrink: 0 }}>
                  <button className="btn btn-secondary" onClick={() => {
                    setMapFullscreen(false);
                    if (currentPhotoIdx === 0) setStep(0);
                    else { setCurrentPhotoIdx(i => i - 1); setStep(2); }
                  }}>Indietro</button>
                  <button className="btn btn-primary" disabled={!canProceedStep1} onClick={() => { setMapFullscreen(false); setStep(2); }}>
                    Avanti
                  </button>
                </div>
              </div>
            )}
          </div>

          {!mapFullscreen && (
            <>
              {cur.position && (
                <div style={{ marginTop: 12 }}>
                  <PositionMeta position={cur.position} geoInfo={cur.geoInfo} stage={cur.stage} />
                </div>
              )}
              <div className="btn-row">
                <button className="btn btn-secondary" onClick={() => {
                  if (currentPhotoIdx === 0) setStep(0);
                  else { setCurrentPhotoIdx(i => i - 1); setStep(2); }
                }}>Indietro</button>
                <button className="btn btn-primary" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                  Avanti
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 2 — Title & AI */}
      {step === 2 && cur && (
        <div className="step-card">
          <h2>3. Titolo e descrizione</h2>

          {photos.length > 1 && (
            <div className="photo-progress-badge">
              <img src={cur.previewUrl} alt="" />
              <span className="tag">Foto {currentPhotoIdx + 1} di {photos.length}: {cur.file.name}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
            <img
              src={cur.draft?.paths?.thumb_url || cur.previewUrl}
              alt="Anteprima"
              style={{ width: 110, height: 82, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid #eee', background: '#000' }}
            />
            <PhotoMeta
              autoreName={autoreName}
              dataScatto={cur.exifDatetime}
              stageRef={cur.stage?.stage_ref}
              distanceM={cur.stage?.distance_m}
              lat={cur.position?.lat}
              lng={cur.position?.lng}
              regione={cur.geoInfo?.regione}
              provincia={cur.geoInfo?.provincia}
              comune={cur.geoInfo?.comune}
            />
          </div>

          {cur.aiLoading && (
            <div className="ai-loading-block">
              <div className="ai-loading-spinner" />
              <p className="ai-loading-label">Il motore AI Claude sta analizzando la foto…</p>
              <p className="ai-loading-sub">Generazione di titolo e descrizione in corso, potrai modificarli a tuo piacimento</p>
            </div>
          )}

          {!cur.aiLoading && (
            <>
              {cur.aiError && (
                <div className="ai-error-block">
                  AI non disponibile — inserisci titolo e descrizione manualmente.
                </div>
              )}
              <div className="field">
                <label>Titolo * <span style={{ color: '#888', fontWeight: 400 }}>(max 60 caratteri)</span></label>
                <input
                  type="text"
                  value={cur.titolo}
                  onChange={(e) => updatePhotoById(cur.id, { titolo: e.target.value })}
                  maxLength={60}
                  placeholder="Titolo della foto..."
                />
                <div className="hint">{cur.titolo.length}/60</div>
              </div>
              <div className="field">
                <label>Descrizione <span style={{ color: '#888', fontWeight: 400 }}>(max 280 caratteri)</span></label>
                <textarea
                  value={cur.caption}
                  onChange={(e) => updatePhotoById(cur.id, { caption: e.target.value })}
                  maxLength={280}
                  placeholder="Descrizione della foto..."
                />
                <div className="hint">{cur.caption.length}/280</div>
              </div>
              <div className="btn-row">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>Indietro</button>
                <button
                  className="btn btn-primary"
                  disabled={!cur.titolo.trim()}
                  onClick={() => {
                    if (currentPhotoIdx + 1 < photos.length) {
                      setCurrentPhotoIdx(i => i + 1);
                      setStep(1);
                    } else {
                      setStep(3);
                    }
                  }}
                >
                  {currentPhotoIdx + 1 < photos.length
                    ? `Avanti → foto ${currentPhotoIdx + 2}`
                    : 'Avanti'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 3 — Summary */}
      {step === 3 && (
        <div className="step-card">
          <h2>4. Riepilogo</h2>

          {photos.length > 1 && (
            <div style={{ marginBottom: 16, padding: '12px', background: '#f5f7fa', borderRadius: 6 }}>
              <PhotoMeta
                autoreName={autoreName}
                socioCai={socioCai}
                sezioneCai={sezioneCai}
                ruoloCai={ruoloCai}
                referenteSicai={referenteSicai}
                referenteSicaiAmbito={referenteSicaiAmbito}
              />
            </div>
          )}

          {photos.map((p, i) => (
            <div className="upload-summary-card" key={p.id}>
              {photos.length > 1 && (
                <div className="upload-summary-card__label">Foto {i + 1} di {photos.length}</div>
              )}
              <img src={p.previewUrl} alt={p.titolo} />
              <div className="upload-summary-card__body">
                <PhotoMeta
                  titolo={p.titolo}
                  caption={p.caption}
                  {...(photos.length === 1 ? { autoreName, socioCai, sezioneCai, ruoloCai, referenteSicai, referenteSicaiAmbito } : {})}
                  dataScatto={p.exifDatetime}
                  stageRef={p.stage?.stage_ref}
                  distanceM={p.stage?.distance_m}
                  lat={p.position?.lat}
                  lng={p.position?.lng}
                  regione={p.geoInfo?.regione}
                  provincia={p.geoInfo?.provincia}
                  comune={p.geoInfo?.comune}
                />
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 12, fontSize: 13, padding: '7px 14px' }}
                  onClick={() => setEditingPhotoId(p.id)}
                >
                  ✏️ Modifica
                </button>
              </div>
            </div>
          ))}

          <div className="btn-row" style={{ marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={() => {
              setCurrentPhotoIdx(photos.length - 1);
              setStep(2);
            }}>Indietro</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Avanti</button>
          </div>
        </div>
      )}

      {/* STEP 4 — Consent + Publish */}
      {step === 4 && (
        <div className="step-card">
          <h2>5. Accetta e pubblica</h2>
          {consent ? (
            <ConsentText markdown={consent.markdown} />
          ) : (
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}><span className="loading-dots">Caricamento</span></p>
          )}
          <div className="checkbox-row" style={{ alignItems: 'flex-start', background: consentAccepted ? '#f0f7f0' : '#fff8f0', border: `1px solid ${consentAccepted ? '#b2d8b2' : '#f5a623'}`, borderRadius: 6, padding: '10px 12px' }}>
            <input
              type="checkbox"
              id="consent-accepted"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <label htmlFor="consent-accepted" style={{ fontWeight: 500 }}>
              Dichiaro di aver letto il documento di consenso, di accettare la pubblicazione delle fotografie con licenza <strong>CC BY 4.0</strong>, di cedere i diritti di proprietà delle fotografie al <strong>Club Alpino Italiano</strong>, e di essere titolare dei diritti sulle foto caricate.{' '}
              <span style={{ color: '#c00', fontWeight: 700 }}>Obbligatorio</span>
            </label>
          </div>
          <div className="checkbox-row" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              id="consent-marketing"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
            />
            <label htmlFor="consent-marketing" style={{ color: '#555' }}>
              Autorizzo <strong>Montagna Servizi SCPA</strong> a contattarmi per comunicazioni relative al Sentiero Italia CAI (facoltativo).
            </label>
          </div>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setStep(3)}>Indietro</button>
            <button className="btn btn-primary" disabled={submitting || !consentAccepted} onClick={handleFinalize}>
              {submitting
                ? <span className="loading-dots">{submitProgress || 'Pubblicazione'}</span>
                : photos.length > 1 ? `Pubblica ${photos.length} foto` : 'Pubblica foto'}
            </button>
          </div>
        </div>
      )}

      {editingPhotoId && (() => {
        const ep = photos.find(ph => ph.id === editingPhotoId);
        return ep ? (
          <EditPhotoModal
            photo={ep}
            onConfirm={(updates) => { updatePhotoById(editingPhotoId, updates); setEditingPhotoId(null); }}
            onClose={() => setEditingPhotoId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

function EditPhotoModal({ photo, onConfirm, onClose }) {
  const [position, setPosition] = useState(photo.position);
  const [geoInfo, setGeoInfo] = useState(photo.geoInfo);
  const [stage, setStage] = useState(photo.stage);
  const [titolo, setTitolo] = useState(photo.titolo);
  const [caption, setCaption] = useState(photo.caption);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handlePositionChange(pos) {
    setPosition(pos);
    setGeoInfo(null);
    setStage(undefined);
    fetch(`/api/geocode?lat=${pos.lat}&lng=${pos.lng}`)
      .then(r => r.ok ? r.json() : null)
      .then(geo => { if (geo) setGeoInfo(geo); })
      .catch(() => {});
    fetch(`/api/stages/nearest?lat=${pos.lat}&lng=${pos.lng}`)
      .then(r => r.ok ? r.json() : null)
      .then(s => setStage(s))
      .catch(() => setStage(null));
  }

  const withinThreshold = stage === undefined || stage === null || !!stage?.stage_ref;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-modal__header">
          <h3 className="edit-modal__title">Modifica foto</h3>
          <button className="edit-modal__close" onClick={onClose} aria-label="Chiudi">×</button>
        </div>

        <div className="edit-modal__body">
          <img src={photo.previewUrl} alt={photo.titolo} className="edit-modal__thumb" />

          <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>Posizione</p>
          <div className="map-outer" style={{ marginBottom: 8 }}>
            <LocationPicker
              initialPosition={position || ITALY_CENTER}
              onChange={handlePositionChange}
              withinThreshold={withinThreshold}
              fullscreen={false}
            />
          </div>
          {position && (
            <div style={{ marginBottom: 16 }}>
              <PositionMeta position={position} geoInfo={geoInfo} stage={stage} />
            </div>
          )}

          <div className="field">
            <label>Titolo * <span style={{ color: '#888', fontWeight: 400 }}>(max 60 caratteri)</span></label>
            <input
              type="text"
              value={titolo}
              onChange={e => setTitolo(e.target.value)}
              maxLength={60}
              placeholder="Titolo della foto..."
            />
            <div className="hint">{titolo.length}/60</div>
          </div>
          <div className="field">
            <label>Descrizione <span style={{ color: '#888', fontWeight: 400 }}>(max 280 caratteri)</span></label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              maxLength={280}
              placeholder="Descrizione della foto..."
            />
            <div className="hint">{caption.length}/280</div>
          </div>
        </div>

        <div className="edit-modal__footer">
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button
            className="btn btn-primary"
            disabled={!titolo.trim()}
            onClick={() => onConfirm({ position, geoInfo, stage, titolo, caption })}
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}

function PositionMeta({ position, geoInfo, stage }) {
  const withinThreshold = stage === undefined || stage === null || !!stage?.stage_ref;
  return (
    <>
      <PhotoMeta
        stageRef={stage?.stage_ref}
        distanceM={stage?.distance_m}
        lat={position?.lat}
        lng={position?.lng}
        regione={geoInfo?.regione}
        provincia={geoInfo?.provincia}
        comune={geoInfo?.comune}
      />
      {stage !== undefined && !withinThreshold && (
        <p style={{ marginTop: 8, fontSize: 13 }}>
          <span className="tag warning">
            Nessuna tappa SICAI nel raggio di {Math.round(Number(import.meta.env.VITE_STAGE_MAX_DISTANCE_M || 5000) / 1000)} km — sposta il marker nei pressi del Sentiero Italia.
          </span>
        </p>
      )}
    </>
  );
}

function GpsBadge({ exifGps, stage }) {
  const maxKm = Math.round(Number(import.meta.env.VITE_STAGE_MAX_DISTANCE_M || 5000) / 1000);
  if (!exifGps) {
    return <div className="photo-thumb__badge photo-thumb__badge--nogps" title="Nessun dato GPS nella foto">No GPS</div>;
  }
  if (stage === undefined) {
    return <div className="photo-thumb__badge photo-thumb__badge--loading" title="Verifica posizione in corso…">GPS…</div>;
  }
  if (stage?.stage_ref) {
    return <div className="photo-thumb__badge photo-thumb__badge--ok" title={`GPS presente · tappa ${stage.stage_ref} (${Math.round(stage.distance_m)} m)`}>GPS</div>;
  }
  return <div className="photo-thumb__badge photo-thumb__badge--offtrail" title={`GPS presente, ma fuori dal buffer SICAI (${maxKm} km)`}>GPS</div>;
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
