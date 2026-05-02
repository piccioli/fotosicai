# Changelog

## v1.5.0 - 2026-05-03

### Added
- **Upload multiplo**: selezione di più file, area drag-and-drop, badge GPS per foto (sul sentiero / fuori buffer / senza GPS / in verifica), legenda; flusso che salta gli step manuali quando tutte le foto sono valide sul buffer SICAI, con schermata di arricchimento AI batch prima del riepilogo; modifica da riepilogo (posizione, titolo, descrizione).
- **Dettaglio foto pubblico**: mappa Leaflet con tracciato Sentiero Italia, nome file download strutturato (regione, tappa, autore, hash coordinate).
- **Admin**: API e UI utenti **paginati**; statistiche estese (tappe e regioni senza copertura, conteggi email verificate, top uploaders); adeguamenti dashboard e liste.
- **Dev / QA**: script `scripts/stress_test.sh` / `stress_test.js`, fixture JPEG aggiuntive per stress test e scenari GPS.

### Changed
- **nginx**: `index.html` servita senza cache (`Cache-Control: no-cache`) per allineare la shell SPA agli asset versionati.
- Aggiornati test API per la nuova forma paginata di `GET /api/admin/users` e i campi aggiuntivi di `GET /api/admin/stats`.

## v1.4.0 - 2026-05-02

### Added
- Admin users export to Excel (`GET /api/admin/users/export`) with download button in the admin UI.
- Admin users list includes email verification timestamp when available.

### Changed
- Verification emails include a richer summary of profile/consent selections aligned with the upload flow.

## v1.3.1 - 2026-05-01

### Fixed
- Upload finalize now returns a clear user-facing error when verification email delivery fails.
- Prevent images from remaining stuck in `pending_verification` if SMTP send fails by rolling them back to `draft`.

## v1.3.0 - 2026-05-01

### Added
- Email verification flow for photo publication with token-based confirmation endpoint.
- SMTP mail delivery support (local Mailpit and production SMTP providers).
- New frontend pending verification page and upload UX updates for author email handling.
- Production update script: `scripts/update-production.sh`.

### Changed
- Upload finalization now publishes directly only for recently trusted verified emails.
- Consent step now uses separate mandatory checkboxes with explicit required acknowledgements.
- Legal consent document updated with CAI authorization wording and CC BY 4.0 acceptance.

### Ops
- Safer production updates with `.env` sync from `.env.example`, DB backup, idempotent migrations, and Docker restart.
