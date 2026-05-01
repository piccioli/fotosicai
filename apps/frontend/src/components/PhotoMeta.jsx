import React from 'react';

const SICAI_TRACK_BASE = import.meta.env.VITE_SICAI_TRACK_BASE_URL || 'https://sentieroitalia.cai.it/track/si-';

function stageUrl(ref) {
  return `${SICAI_TRACK_BASE}${ref.toLowerCase()}/`;
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function PhotoMeta({ titolo, caption, autoreName, dataScatto, stageRef, distanceM, lat, lng, regione, provincia, comune }) {
  const luogo = [regione, provincia, comune].filter(Boolean).join(' › ');

  const rows = [
    titolo     ? { label: 'Titolo',          value: titolo } : null,
    caption    ? { label: 'Descrizione',      value: caption } : null,
    autoreName ? { label: 'Autore',           value: autoreName } : null,
    dataScatto ? { label: 'Data dello scatto', value: formatDate(dataScatto) } : null,
    stageRef   ? {
      label: 'Tappa SICAI',
      value: (
        <>
          <a href={stageUrl(stageRef)} target="_blank" rel="noopener noreferrer">[{stageRef}]</a>
          {distanceM != null && <span style={{ color: '#888' }}> ({Math.round(distanceM)} m dal tracciato)</span>}
        </>
      ),
    } : null,
    (lat != null && lng != null) ? { label: 'Coordinate', value: `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` } : null,
    luogo      ? { label: 'Luogo',            value: luogo } : null,
  ].filter(Boolean);

  if (!rows.length) return null;

  return (
    <dl className="photo-meta">
      {rows.map(({ label, value }) => (
        <div key={label} className="photo-meta__row">
          <dt>{label}:</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
