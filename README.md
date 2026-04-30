# FotoSICAI — Piattaforma fotografica del Sentiero Italia CAI

Webapp full-stack per il caricamento, la georeferenziazione e la visualizzazione di fotografie lungo il Sentiero Italia CAI (SICAI).

## Funzionalità

- **Upload guidato** (5 step): caricamento immagini con estrazione automatica metadati EXIF (GPS, data), posizionamento su mappa, generazione AI di titolo e caption (Claude vision), consenso e pubblicazione immediata
- **Mappa interattiva**: visualizzazione foto georeferenziate come marker-thumbnail clusterizzati, overlay del tracciato SICAI
- **Motore di ricerca**: testo libero (titolo, descrizione, autore, tappa) + filtri per regione, provincia, comune, tappa SICAI

## Stack

- **Frontend**: React (Vite), Leaflet + MarkerCluster
- **Backend**: Node.js (Express), SQLite (better-sqlite3)
- **AI**: Anthropic Claude Sonnet (vision) per titolo e caption
- **Storage**: filesystem locale organizzato per tappa (`/storage/foto/{stage_ref}/{image_id}/`)
- **Deploy**: Docker Compose (nginx + backend Node)

---

## Sviluppo locale

### Prerequisiti
- Node.js 20+
- npm 10+

### Setup

```bash
git clone <url-repository> fotosicai
cd fotosicai

# Configurazione
cp .env.example .env
# Modifica .env: inserisci ANTHROPIC_API_KEY e ADMIN_TOKEN

# Installazione dipendenze
npm install

# Avvio (backend :3000 + frontend :5173)
npm run dev
```

L'app è disponibile su [http://localhost:5173](http://localhost:5173).

Il backend è su `http://localhost:3000/api`.

---

## Produzione (Docker)

### Setup

```bash
cp .env.example .env
# Modifica .env: ANTHROPIC_API_KEY, ADMIN_TOKEN, PUBLIC_BASE_URL, NOMINATIM_USER_AGENT
```

### Avvio

```bash
docker compose up -d --build
```

L'app è raggiungibile su `http://localhost:8080` (o tramite reverse proxy).

### HTTPS con Apache (sicai-foto.montagnaservizi.it)

Il container frontend è esposto solo su `127.0.0.1:8080`. Usa Apache come reverse proxy:

```apache
<VirtualHost *:443>
  ServerName sicai-foto.montagnaservizi.it
  ProxyPreserveHost On
  ProxyPass / http://127.0.0.1:8080/
  ProxyPassReverse / http://127.0.0.1:8080/
  # ... SSLCertificateFile ecc.
</VirtualHost>
```

Imposta anche `PUBLIC_BASE_URL=https://sicai-foto.montagnaservizi.it` nel file `.env`.

---

## Variabili d'ambiente

Vedi `.env.example` per la lista completa.

| Variabile | Default | Descrizione |
|---|---|---|
| `PORT` | `3000` | Porta backend |
| `DATABASE_PATH` | `./data/fotosicai.sqlite` | Path SQLite |
| `STORAGE_DIR` | `./storage` | Directory immagini |
| `ANTHROPIC_API_KEY` | — | API key Claude (obbligatoria) |
| `AI_MODEL` | `claude-sonnet-4-6` | Modello AI |
| `ADMIN_TOKEN` | — | Bearer token per endpoint admin (obbligatorio) |
| `NOMINATIM_USER_AGENT` | `fotosicai/1.0` | User-Agent per Nominatim |
| `STAGE_MAX_DISTANCE_M` | `2000` | Raggio massimo (m) per associazione tappa |
| `CONSENT_VERSION` | `2026-04-30` | Versione documento consenso |
| `PUBLIC_BASE_URL` | `http://localhost:8080` | Base URL pubblica per link immagini |

---

## API

| Metodo | Path | Descrizione |
|---|---|---|
| `POST` | `/api/upload` | Upload file → draft |
| `POST` | `/api/upload/:id/ai` | Genera titolo/caption AI |
| `POST` | `/api/upload/:id/finalize` | Pubblica foto |
| `GET` | `/api/images?bbox=W,S,E,N` | Lista immagini per bounding box |
| `GET` | `/api/images/:id` | Dettaglio immagine |
| `GET` | `/api/search?q=&regione=&...` | Ricerca full-text + filtri |
| `GET` | `/api/stages` | Lista tappe SICAI |
| `GET` | `/api/legal/consent` | Documento di consenso |
| `DELETE` | `/api/admin/images/:id` | Cancella immagine (Bearer token) |

---

## Struttura directory

```
fotosicai/
├── apps/
│   ├── backend/       Express API + servizi
│   └── frontend/      React (Vite) SPA
├── DATA/              GeoJSON SICAI + mapping tappe (non modificare)
├── legal/             Documento consenso (sostituire bozza con testo definitivo)
├── storage/           Immagini caricate (volume Docker, non committato)
├── legacy/            Vecchia app accreditamento (archivio)
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
├── docker-compose.yml
└── .env.example
```

---

## Note operative

### Documento di consenso
Il file `legal/consenso.md` contiene un **testo placeholder**. Va sostituito con la versione definitiva approvata prima del go-live.

### Cancellazione foto (admin)
```bash
curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/admin/images/<uuid>
```

### Backup
I dati sono in due luoghi:
- `docker volume ls | grep db_data` → SQLite
- `docker volume ls | grep photo_storage` → immagini

Per backup: `docker run --rm -v fotosicai_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data`

---

## Licenza

MIT — vedi [LICENSE](LICENSE).
