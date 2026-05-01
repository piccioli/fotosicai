# Changelog

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
