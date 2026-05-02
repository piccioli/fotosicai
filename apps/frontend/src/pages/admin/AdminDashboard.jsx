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

function TagList({ items }) {
  if (!items || items.length === 0) return <p className="admin-empty" style={{ fontSize: 13 }}>Nessuna voce mancante.</p>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item) => (
        <span key={item} className="admin-badge admin-badge--neutral" style={{ fontSize: 12 }}>{item}</span>
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
  const maxUser = stats.top10_users.reduce((m, r) => Math.max(m, r.photo_count), 1);

  return (
    <div>
      <h2 className="admin-page-title">Dashboard</h2>

      <div className="admin-kpi-row">
        <KpiCard label="Foto caricate" value={stats.total_uploaded} />
        <KpiCard label="In attesa email" value={stats.total_pending_email} accent="#1565c0" />
        <KpiCard label="In attesa validazione" value={stats.total_pending_validation} accent="#e65100" />
        <KpiCard label="Pubblicate" value={stats.total_published} accent="#2e7d32" />
      </div>

      {/* User stats */}
      <div className="admin-kpi-row" style={{ marginBottom: 28 }}>
        <KpiCard label="Autori totali" value={stats.total_users} />
        <KpiCard label="Email verificata" value={stats.total_verified} accent="#2e7d32" />
        <KpiCard label="Email non verificata" value={stats.total_unverified} accent="#e65100" />
      </div>

      <div className="admin-charts-row" style={{ marginBottom: 16 }}>
        <section className="admin-card">
          <h3 className="admin-card__title">Top 10 autori per numero di foto</h3>
          {stats.top10_users.length === 0
            ? <p className="admin-empty">Nessun autore.</p>
            : (
              <div className="admin-barchart">
                {stats.top10_users.map((u) => (
                  <div key={u.email} className="admin-barchart__row">
                    <span className="admin-barchart__label" title={u.email} style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.autore_nome || u.email}
                    </span>
                    <div className="admin-barchart__track">
                      <div
                        className="admin-barchart__fill"
                        style={{ width: `${Math.round((u.photo_count / maxUser) * 100)}%` }}
                      />
                    </div>
                    <span className="admin-barchart__count">{u.photo_count}</span>
                  </div>
                ))}
              </div>
            )}
        </section>
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

      <div className="admin-charts-row" style={{ marginTop: 16 }}>
        <section className="admin-card">
          <h3 className="admin-card__title">Tappe mancanti ({stats.missing_stages.length})</h3>
          <TagList items={stats.missing_stages} />
        </section>

        <section className="admin-card">
          <h3 className="admin-card__title">Regioni mancanti ({stats.missing_regioni.length})</h3>
          <TagList items={stats.missing_regioni} />
        </section>
      </div>
    </div>
  );
}
