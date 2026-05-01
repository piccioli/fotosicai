import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api.js';

function KpiCard({ label, value, accent }) {
  return (
    <div className="admin-kpi" style={accent ? { borderTop: `4px solid ${accent}` } : undefined}>
      <div className="admin-kpi__value">{value ?? '—'}</div>
      <div className="admin-kpi__label">{label}</div>
    </div>
  );
}

function BarChart({ items, labelKey, countKey, maxCount }) {
  return (
    <div className="admin-barchart">
      {items.map((item) => (
        <div key={item[labelKey]} className="admin-barchart__row">
          <span className="admin-barchart__label">{item[labelKey]}</span>
          <div className="admin-barchart__track">
            <div
              className="admin-barchart__fill"
              style={{ width: `${Math.round((item[countKey] / maxCount) * 100)}%` }}
            />
          </div>
          <span className="admin-barchart__count">{item[countKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="admin-alert admin-alert--error">{error}</div>;
  if (!stats) return <div className="admin-loading">Caricamento statistiche…</div>;

  const maxStage = stats.by_stage.reduce((m, r) => Math.max(m, r.count), 1);
  const maxRegion = stats.by_region.reduce((m, r) => Math.max(m, r.count), 1);

  return (
    <div>
      <h2 className="admin-page-title">Dashboard</h2>

      <div className="admin-kpi-row">
        <KpiCard label="Foto caricate" value={stats.total_uploaded} />
        <KpiCard label="Pubblicate" value={stats.total_published} accent="#2e7d32" />
        <KpiCard label="In attesa verifica" value={stats.total_pending} accent="#e65100" />
      </div>

      <div className="admin-charts-row">
        <section className="admin-card">
          <h3 className="admin-card__title">Distribuzione per tappa</h3>
          {stats.by_stage.length === 0
            ? <p className="admin-empty">Nessuna foto pubblicata.</p>
            : <BarChart items={stats.by_stage} labelKey="stage_ref" countKey="count" maxCount={maxStage} />}
        </section>

        <section className="admin-card">
          <h3 className="admin-card__title">Distribuzione per regione</h3>
          {stats.by_region.length === 0
            ? <p className="admin-empty">Nessuna foto pubblicata.</p>
            : <BarChart items={stats.by_region} labelKey="regione" countKey="count" maxCount={maxRegion} />}
        </section>
      </div>
    </div>
  );
}
