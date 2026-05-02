# FotoSICAI — Flusso di upload e proprietà del dato

**Documento informativo per il DPO del Club Alpino Italiano**

| | |
|---|---|
| **Titolare del progetto** | Club Alpino Italiano (CAI) |
| **Soggetto attuatore / sviluppo** | Montagna Servizi S.C.p.A. |
| **Applicazione** | FotoSICAI — piattaforma web di raccolta fotografica del Sentiero Italia CAI |
| **URL produzione** | https://fotosicai.montagnaservizi.it |
| **Versione applicazione** | v1.5.0 (maggio 2026) |
| **Versione documento consenso** | 2026-05-01 |
| **Data documento** | 2 maggio 2026 |

---

## 1. Finalità della piattaforma

FotoSICAI è una piattaforma web pubblica realizzata da Montagna Servizi S.C.p.A. nell'ambito dell'incarico ricevuto dal Club Alpino Italiano per la valorizzazione del Sentiero Italia CAI (di seguito "SICAI"). La piattaforma raccoglie, geolocalizza e mette a disposizione fotografie scattate lungo il tracciato SICAI, con l'obiettivo di costruire un patrimonio iconografico unitario, georeferenziato e liberamente riutilizzabile per le finalità istituzionali, promozionali e divulgative del CAI.

Le fotografie raccolte sono pubblicate sulla mappa interattiva della piattaforma, indicizzate per regione, provincia, comune e tappa SICAI, e accompagnate da titolo, descrizione e attribuzione dell'autore.

---

## 2. Soggetti coinvolti nel trattamento

**Titolare del trattamento.** Club Alpino Italiano, con sede legale in Milano, Via E. Petrella 19 — P.IVA 03654880156 — PEC cai@pec.cai.it.

**Responsabile del trattamento (ex art. 28 GDPR).** Montagna Servizi S.C.p.A., con sede legale in Milano, Via E. Petrella 19 — C.F./P.IVA 11790660960 — PEC montagnaserviziscpa@legalmail.it — email info@montagnaservizi.com. Montagna Servizi opera in qualità di soggetto attuatore per il SICAI e gestisce, per conto del CAI, lo sviluppo, l'hosting, la manutenzione e l'amministrazione tecnica della piattaforma FotoSICAI.

**Interessati / Autori.** Le persone fisiche che caricano volontariamente fotografie sulla piattaforma. Possono essere soci CAI o non soci. Per ogni autore vengono raccolti nome, cognome, indirizzo email, e (facoltativamente) sezione CAI di appartenenza, ruolo nel CAI ed eventuale incarico di referente SICAI di tappa o regionale.

**Soggetti terzi destinatari.** Il CAI, ai sensi del documento di consenso accettato dall'autore, può mettere le fotografie a disposizione di soggetti terzi (es. Enti Parco, Regioni, partner, testate giornalistiche, enti di promozione turistica) esclusivamente per finalità promozionali, informative o istituzionali legate al SICAI. La licenza pubblica con cui le foto sono rilasciate (CC BY 4.0) consente inoltre il riuso da parte di chiunque, con obbligo di attribuzione.

---

## 3. Dati personali trattati

Sulla piattaforma sono trattati i seguenti dati personali dell'Autore:

- nome e cognome;
- indirizzo email (utilizzato per la verifica dell'identità tramite link di conferma e per le comunicazioni di servizio);
- data e ora di convalida dell'indirizzo email;
- flag di consenso obbligatorio (autorizzazione alla pubblicazione e licenza CC BY 4.0);
- flag di consenso facoltativo (autorizzazione a essere ricontattato da Montagna Servizi per comunicazioni relative al SICAI);
- versione del documento di consenso accettato;
- (opzionale) sezione CAI di appartenenza, ruolo / titolo nel CAI, eventuale incarico di referente SICAI di tappa o regionale.

Per ciascuna fotografia caricata sono inoltre trattati i seguenti metadati, che possono qualificarsi come dati personali in quanto associati all'Autore:

- coordinate GPS (latitudine, longitudine) estratte dai dati EXIF della fotografia o, in subordine, indicate manualmente dall'Autore sulla mappa;
- data e ora di scatto;
- regione, provincia, comune e tappa SICAI calcolati a partire dalle coordinate;
- titolo e descrizione (generati con AI vision e revisionati / modificati dall'autore prima della pubblicazione);
- file immagine in tre risoluzioni (originale, media, thumbnail).

---

## 4. Flusso di upload

Il flusso di caricamento di una fotografia avviene attraverso una procedura guidata in più step nel frontend pubblico, e si conclude solo dopo verifica dell'indirizzo email e validazione amministrativa. Le foto non sono mai pubblicate prima del completamento di entrambi i passaggi di validazione.

### 4.1 Step 1 — Selezione foto e dati anagrafici

L'Autore accede al form pubblico e seleziona una o più fotografie (anche in modalità batch tramite drag & drop). Il sistema estrae i dati EXIF da ciascuna immagine e classifica ogni foto in tre stati visibili come badge sulle thumbnail:

- **GPS OK** (verde) — la foto contiene coordinate GPS valide e ricade all'interno del buffer SICAI (raggio configurato, default 2.000 metri rispetto al tracciato);
- **GPS fuori buffer** (grigio) — la foto contiene coordinate GPS ma non ricade nel buffer SICAI;
- **GPS assente** (rosso) — la foto non contiene coordinate GPS nei metadati EXIF.

Nello stesso step l'Autore inserisce nome, cognome ed email, e (facoltativamente) le informazioni relative alla sua relazione con il CAI (socio sì/no, sezione, ruolo, referente SICAI).

### 4.2 Step 2 e 3 — Posizionamento e revisione (solo per foto non OK)

Le foto in stato GPS OK saltano direttamente alla generazione AI dei metadati e al riepilogo. Per le foto in stato GPS fuori buffer o GPS assente, l'Autore deve, foto per foto, posizionare manualmente il marker sulla mappa (oppure scartare la foto). Il sistema ricalcola in tempo reale regione, provincia, comune e tappa SICAI a partire dalla nuova posizione, utilizzando il servizio Nominatim di OpenStreetMap (rispettando la policy d'uso).

### 4.3 Generazione AI di titolo e descrizione

Per ciascuna foto in carico, il backend invia l'immagine al servizio Anthropic Claude (modello vision) per ottenere una proposta di titolo e descrizione coerenti con il soggetto fotografato e con il contesto SICAI. La chiamata avviene server-side; le immagini non sono trattenute dal fornitore AI ai sensi delle condizioni d'uso commerciali Anthropic.

### 4.4 Step 4 — Riepilogo e modifica

L'Autore vede tutte le foto caricate con i relativi dati (thumb, posizione su mappa, titolo, descrizione, autore). Per ciascuna foto può aprire una modale di modifica per: cambiare la posizione sulla mappa (con ricalcolo automatico di regione/provincia/comune/tappa), correggere titolo e descrizione, oppure rimuovere la foto dal batch.

### 4.5 Step 5 — Consenso e pubblicazione

L'Autore deve apporre la spunta sul **flag obbligatorio** di accettazione del documento di consenso (cfr. documento "FotoSICAI — Richiesta di accettazione delle condizioni"). Solo se non già presente nel database, gli viene proposto un secondo **flag facoltativo** di autorizzazione a essere ricontattato da Montagna Servizi per comunicazioni inerenti il SICAI.

Al click su "Pubblica", il backend salva le foto in stato di **draft** in attesa di verifica email.

### 4.6 Verifica indirizzo email

Il sistema invia all'Autore una email contenente un link di conferma. Il messaggio riepiloga i dati inseriti, fa riferimento all'incarico di Montagna Servizi per il SICAI ed elenca le foto in attesa di pubblicazione. Il click sul link convalida l'indirizzo email (campo `email_verified_at` nel record utente). In assenza di conferma, le foto restano in stato draft e non sono mai pubblicate.

### 4.7 Validazione amministrativa

Le foto con email verificata entrano nella coda di validazione del backoffice di amministrazione (`/admin`, accessibile solo con credenziali da `.env`). Un amministratore Montagna Servizi può: visionare ciascuna foto e i dati associati, marcarla come **validata** (e quindi pubblicata sul frontend), oppure cancellarla in caso di contenuto non idoneo (foto fuori contesto, contenuti inappropriati, dubbi sulla titolarità). Solo le foto con stato `email_verified = true` AND `validated = true` sono mostrate sulla mappa pubblica e nei risultati di ricerca.

### 4.8 Pubblicazione

Al passaggio in stato validato, la foto è esposta:

- sulla mappa interattiva pubblica (come marker-thumbnail clusterizzato);
- nelle API pubbliche (`/api/images`, `/api/search`);
- nel motore di ricerca testuale (titolo, descrizione, autore, tappa) e per filtri (regione, provincia, comune, tappa);
- nella pagina di dettaglio pubblica della singola foto, che include mappa con posizione e tracciato SICAI, link di download e testo copiabile per la corretta citazione della fonte.

---

## 5. Architettura tecnica e localizzazione dei dati

L'applicazione è realizzata come stack full-stack in container Docker, ospitato su infrastruttura Montagna Servizi:

- **frontend**: React (Vite), servito tramite nginx;
- **backend**: Node.js (Express), persistenza su SQLite (better-sqlite3);
- **storage immagini**: filesystem locale del server, organizzato per tappa (`/storage/foto/{stage_ref}/{image_id}/`), montato come volume Docker;
- **database**: SQLite su volume Docker dedicato (`db_data`);
- **reverse proxy**: Apache con TLS (Let's Encrypt);
- **AI vision**: chiamate server-side al servizio Anthropic Claude (claude-sonnet-4-6), unico flusso che esce dal perimetro Montagna Servizi, esclusivamente con il file immagine e senza dati anagrafici dell'autore;
- **reverse geocoding**: Nominatim/OpenStreetMap, server-side, esclusivamente con coordinate GPS e senza dati personali.

I dati personali (anagrafica autori, email, consensi, metadati foto) e le immagini risiedono fisicamente su server gestiti da Montagna Servizi. Non vengono trasferiti dati personali a fornitori cloud terzi al di fuori dello SEE per le funzionalità core; l'unica chiamata extra-UE è quella verso il servizio AI Anthropic, limitata al file immagine.

---

## 6. Proprietà del dato

### 6.1 Proprietà delle fotografie

L'Autore mantiene la titolarità del **diritto d'autore morale** sulla propria opera fotografica. Con l'accettazione del documento di consenso, l'Autore concede al Club Alpino Italiano una **licenza d'uso non esclusiva, gratuita, a tempo illimitato e senza limiti territoriali**, e accetta che le fotografie pubblicate sulla piattaforma siano rilasciate al pubblico con licenza **Creative Commons Attribution 4.0 International (CC BY 4.0)**. Il CAI si impegna, ove tecnicamente possibile, a citare il nome dell'Autore.

### 6.2 Proprietà del database e dei metadati

Il database FotoSICAI — contenente il catalogo delle fotografie, i metadati associati, l'indicizzazione per tappa SICAI e il legame con il tracciato — è di proprietà del Club Alpino Italiano in qualità di Titolare del progetto. Montagna Servizi ne cura la gestione tecnica in qualità di Responsabile del trattamento. Al termine dell'incarico, Montagna Servizi consegnerà al CAI l'intero patrimonio dati (database e immagini in tutte le risoluzioni) in formato standard riutilizzabile.

### 6.3 Proprietà dei dati personali

I dati personali degli Autori sono trattati dal CAI in qualità di Titolare e da Montagna Servizi in qualità di Responsabile, ai sensi del Regolamento UE 2016/679 (GDPR), per le finalità di:

- gestione del rapporto di collaborazione tra l'Autore e il progetto SICAI;
- pubblicazione dei contenuti e corretta attribuzione dei crediti fotografici;
- comunicazioni di servizio relative alle foto caricate;
- (solo previo consenso facoltativo) ricontatto per comunicazioni inerenti il SICAI.

### 6.4 Diritti degli interessati

In ogni momento l'Autore può esercitare i diritti previsti dagli articoli 15-22 del GDPR (accesso, rettifica, cancellazione, limitazione, portabilità, opposizione) scrivendo ai recapiti del Titolare (CAI) o del Responsabile (Montagna Servizi) indicati in apertura del documento. La cancellazione di una fotografia comporta la rimozione del file dallo storage e del relativo record dal database; le copie già diffuse a terzi in licenza CC BY 4.0 prima della cancellazione non sono richiamabili, in conformità con la natura della licenza pubblica accettata dall'Autore al momento del caricamento.

---

## 7. Misure di sicurezza

- accesso al backoffice di amministrazione protetto da username/password (configurate via `.env`) e da segreto HMAC per la firma dei session token;
- token bearer separato per gli endpoint admin esposti via API (es. cancellazione foto);
- TLS end-to-end sul dominio pubblico tramite certificato Let's Encrypt;
- separazione dei volumi Docker per database (`db_data`) e immagini (`photo_storage`), entrambi oggetto di backup periodico;
- audit log delle azioni di validazione e cancellazione svolte dagli amministratori;
- nessuna esposizione pubblica del database SQLite o delle credenziali AI/admin (variabili d'ambiente non committate, mascherate nei log).

---

## 8. Conservazione dei dati

I dati personali sono conservati per tutta la durata del progetto FotoSICAI e dell'incarico di Montagna Servizi per il SICAI. Alla cessazione del rapporto, il CAI in qualità di Titolare deciderà se proseguire il trattamento direttamente o per il tramite di altro soggetto attuatore. In caso di interruzione del progetto, i dati saranno conservati per il tempo strettamente necessario all'archiviazione storica del patrimonio fotografico, ferma restando la possibilità per gli Autori di richiederne la cancellazione individuale.

---

*Documento redatto da Montagna Servizi S.C.p.A. per il DPO del Club Alpino Italiano — 2 maggio 2026.*
