# FotoSICAI — Flusso di upload e proprietà del dato

**Documento informativo per il DPO del Club Alpino Italiano**

| | |
|---|---|
| **Titolare del progetto** | Club Alpino Italiano (CAI) |
| **Soggetto attuatore / sviluppo** | Montagna Servizi S.C.p.A. |
| **Applicazione** | FotoSICAI — piattaforma web di raccolta fotografica del Sentiero Italia CAI |
| **URL produzione** | https://fotosicai.montagnaservizi.it |
| **URL form di caricamento** | https://fotosicai.montagnaservizi.it/upload |
| **Riferimento contrattuale** | Piano Progetto Sentiero Italia CAI — CIG B165634123 (2024-2026) |
| **Versione applicazione** | v1.6.0 (maggio 2026) |
| **Versione documento consenso** | 2026-05-02 |
| **Data documento** | 2 maggio 2026 |

---

## 1. Finalità della piattaforma

FotoSICAI è una piattaforma web pubblica realizzata da Montagna Servizi S.C.p.A. nell'ambito del **Piano Progetto Sentiero Italia CAI (CIG B165634123, 2024-2026)**, affidato dal Club Alpino Italiano per la valorizzazione del Sentiero Italia CAI (di seguito "SICAI"). La piattaforma raccoglie, geolocalizza e mette a disposizione fotografie scattate lungo il tracciato SICAI, con l'obiettivo di costruire un patrimonio iconografico unitario, georeferenziato e liberamente riutilizzabile per le finalità istituzionali, promozionali e divulgative del CAI.

Il form di caricamento delle fotografie è accessibile all'indirizzo **https://fotosicai.montagnaservizi.it/upload**. Le fotografie raccolte sono pubblicate sulla mappa interattiva della piattaforma, indicizzate per regione, provincia, comune e tappa SICAI, e accompagnate da titolo, descrizione e attribuzione dell'autore.

---

## 2. Soggetti coinvolti nel trattamento

**Titolare del trattamento.** Club Alpino Italiano, con sede legale in Milano, Via E. Petrella 19 — P.IVA 03654880156 — PEC cai@pec.cai.it.

**Responsabile del trattamento (ex art. 28 GDPR).** Montagna Servizi S.C.p.A., con sede legale in Milano, Via E. Petrella 19 — C.F./P.IVA 11790660960 — PEC montagnaserviziscpa@legalmail.it — email info@montagnaservizi.com. Montagna Servizi opera in qualità di soggetto attuatore per il SICAI nell'ambito del **Piano Progetto Sentiero Italia CAI (CIG B165634123, 2024-2026)** e gestisce, per conto del CAI, lo sviluppo, l'hosting, la manutenzione e l'amministrazione tecnica della piattaforma FotoSICAI per la sola durata del contratto.

**Interessati / Autori.** Le persone fisiche che caricano volontariamente fotografie sulla piattaforma. Possono essere soci CAI o non soci. Per ogni autore vengono raccolti nome, cognome, indirizzo email, e (facoltativamente) sezione CAI di appartenenza, ruolo nel CAI ed eventuale incarico di referente SICAI di tappa o regionale.

**Soggetti terzi destinatari.** Il CAI, ai sensi del documento di consenso accettato dall'autore, può mettere le fotografie a disposizione di soggetti terzi (a titolo esemplificativo: Enti Parco, Regioni, enti pubblici e privati, partner, sponsor, testate giornalistiche, enti di promozione turistica, case editrici), anche a titolo oneroso, per qualsiasi finalità lecita coerente con la valorizzazione del Sentiero Italia CAI, inclusi gli usi commerciali. La licenza pubblica con cui le foto sono rilasciate (CC BY 4.0) consente inoltre il riuso da parte di chiunque — anche per fini commerciali — con obbligo di attribuzione.

---

## 3. Dati trattati

I dati gestiti dalla piattaforma si articolano su **due categorie distinte**, che è importante tenere separate sotto il profilo della titolarità e dei diritti dell'interessato.

### 3.1 Dati personali dell'Autore (soggetti al GDPR)

Sono dati personali dell'Autore, trattati dal CAI in qualità di Titolare e da Montagna Servizi in qualità di Responsabile, e su cui l'Autore può sempre esercitare i diritti previsti dagli articoli 15-22 GDPR:

- nome e cognome;
- indirizzo email (utilizzato per la verifica dell'identità tramite link di conferma e per le comunicazioni di servizio);
- data e ora di convalida dell'indirizzo email;
- flag di consenso obbligatorio (autorizzazione alla pubblicazione e licenza CC BY 4.0);
- flag di consenso facoltativo (autorizzazione a essere ricontattato da Montagna Servizi per comunicazioni relative al SICAI);
- versione del documento di consenso accettato;
- (opzionale) sezione CAI di appartenenza, ruolo / titolo nel CAI, eventuale incarico di referente SICAI di tappa o regionale.

### 3.2 Dati delle Opere cedute al CAI (non revocabili)

Per ciascuna fotografia caricata sono inoltre trattati i dati che costituiscono **parte integrante e inscindibile dell'Opera fotografica**:

- file immagine in tre risoluzioni (originale, media, thumbnail);
- coordinate GPS (latitudine, longitudine) estratte dai dati EXIF della fotografia o, in subordine, indicate manualmente dall'Autore sulla mappa;
- data e ora di scatto;
- regione, provincia, comune e tappa SICAI calcolati a partire dalle coordinate;
- titolo e descrizione (generati con AI vision e revisionati / modificati dall'Autore prima della pubblicazione).

Questi dati, dal momento dell'accettazione del consenso e della validazione amministrativa della foto, **non sono qualificabili come dati personali dell'Autore soggetti ai diritti GDPR**: essi sono parte dell'Opera fotografica i cui diritti d'uso sono stati ceduti al Club Alpino Italiano in modo irrevocabile (cfr. § 6 e documento di consenso). Diventano pertanto **dati di proprietà del CAI**, parte del patrimonio iconografico del Sentiero Italia CAI, e l'Autore non può rivendicarne la cancellazione, la rettifica del posizionamento o il ritiro dalla piattaforma. Resta sempre possibile per l'Autore richiedere l'**anonimizzazione dell'attribuzione** (sostituzione del proprio nome con dicitura anonima): tale richiesta è esercitata sul piano dei dati personali dell'Autore (§ 3.1) e non incide sull'Opera in sé né sulla sua presenza nel patrimonio CAI.

L'unico canale tramite cui un'Opera può essere rimossa dalla piattaforma è la procedura di **validazione amministrativa** (cfr. § 4.7), oppure una decisione del CAI in qualità di proprietario del patrimonio.

---

## 4. Flusso di upload

Il flusso di caricamento di una fotografia avviene attraverso una procedura guidata in più step nel frontend pubblico, e si conclude solo dopo verifica dell'indirizzo email e validazione amministrativa. Le foto non sono mai pubblicate prima del completamento di entrambi i passaggi di validazione.

### 4.1 Step 1 — Selezione foto e dati anagrafici

L'Autore accede al form pubblico (URL: `https://fotosicai.montagnaservizi.it/upload`) e seleziona una o più fotografie (anche in modalità batch tramite drag & drop). Il sistema estrae i dati EXIF da ciascuna immagine e classifica ogni foto in tre stati visibili come badge sulle thumbnail:

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

Il sistema invia all'Autore una email contenente un link di conferma. Il messaggio riepiloga i dati inseriti, fa riferimento esplicito al Piano Progetto Sentiero Italia CAI affidato a Montagna Servizi (CIG B165634123, 2024-2026) ed elenca le foto in attesa di pubblicazione. Il click sul link convalida l'indirizzo email (campo `email_verified_at` nel record utente). In assenza di conferma, le foto restano in stato draft e non sono mai pubblicate.

### 4.7 Validazione amministrativa

Le foto con email verificata entrano nella coda di validazione del backoffice di amministrazione (`/admin`, accessibile solo con credenziali da `.env`). Un amministratore Montagna Servizi può: visionare ciascuna foto e i dati associati, marcarla come **validata** (e quindi pubblicata sul frontend), oppure cancellarla in caso di contenuto non idoneo (foto fuori contesto, contenuti inappropriati, dubbi sulla titolarità). Solo le foto con stato `email_verified = true` AND `validated = true` sono mostrate sulla mappa pubblica e nei risultati di ricerca.

La validazione è un atto **discrezionale** del CAI (o del soggetto attuatore da esso designato): il CAI non è obbligato a pubblicare le fotografie caricate dall'Autore e può decidere di non validarle, senza obbligo di motivazione e senza che da ciò sorga alcun diritto in capo all'Autore. Anche dopo la validazione e la pubblicazione, il CAI conserva il diritto di rimuovere un'Opera dalla piattaforma in qualsiasi momento, a propria insindacabile discrezione (cfr. § 6.5).

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

L'Autore mantiene la titolarità del **diritto d'autore morale** sulla propria opera fotografica. Con l'accettazione del documento di consenso, l'Autore concede al Club Alpino Italiano una **licenza d'uso non esclusiva, gratuita, irrevocabile, a tempo illimitato e senza limiti territoriali**, valida per **qualsiasi finalità lecita, anche di natura commerciale e con scopo di lucro**, in coerenza con la valorizzazione del Sentiero Italia CAI e con la missione del Club Alpino Italiano. La licenza copre tutte le forme di utilizzo, riproduzione, modifica, adattamento, pubblicazione, diffusione, distribuzione e messa a disposizione di soggetti terzi, su qualsiasi mezzo e canale (siti web, social media, applicazioni, riviste, libri, cataloghi, materiali promozionali, mostre, prodotti editoriali, audiovisivi, comunicazione istituzionale e commerciale, ecc.). Le fotografie pubblicate sulla piattaforma sono inoltre rilasciate al pubblico con licenza **Creative Commons Attribution 4.0 International (CC BY 4.0)**, che consente a chiunque di condividere e adattare le Opere — anche per usi commerciali — con obbligo di attribuzione dell'autore. Il CAI si impegna, ove tecnicamente possibile, a citare il nome dell'Autore.

**Carattere irrevocabile della concessione.** La concessione dei diritti d'uso al CAI è irrevocabile dal momento del caricamento e della validazione: l'Autore non può, in un momento successivo, richiedere al CAI di interrompere l'uso delle Opere già caricate, né rivendicarne l'uso esclusivo o richiedere compensi economici. Tale irrevocabilità è coerente con la natura del progetto FotoSICAI — costruzione di un patrimonio iconografico stabile del Sentiero Italia CAI, valorizzabile anche economicamente per finanziare le attività di tutela e promozione del Sentiero — e con la successiva pubblicazione delle Opere sotto licenza pubblica CC BY 4.0, che è anch'essa per sua natura non revocabile nei confronti dei terzi che hanno acquisito i diritti d'uso.

### 6.2 Proprietà del database e dei metadati

Il database FotoSICAI — contenente il catalogo delle fotografie, i metadati associati, l'indicizzazione per tappa SICAI e il legame con il tracciato — è di proprietà del Club Alpino Italiano in qualità di Titolare del progetto. Montagna Servizi ne cura la gestione tecnica in qualità di Responsabile del trattamento, limitatamente alla durata del contratto CIG B165634123. Al termine del contratto si applicano gli impegni di consegna, rimozione dei riferimenti e cessazione d'uso descritti al § 9.

### 6.3 Proprietà dei dati personali

I dati personali degli Autori sono trattati dal CAI in qualità di Titolare e da Montagna Servizi in qualità di Responsabile, ai sensi del Regolamento UE 2016/679 (GDPR), per le finalità di:

- gestione del rapporto di collaborazione tra l'Autore e il progetto SICAI;
- pubblicazione dei contenuti e corretta attribuzione dei crediti fotografici;
- comunicazioni di servizio relative alle foto caricate;
- (solo previo consenso facoltativo) ricontatto per comunicazioni inerenti il SICAI.

### 6.4 Diritti degli interessati e perimetro della cancellazione

L'Autore può esercitare i diritti previsti dagli articoli 15-22 del GDPR (accesso, rettifica, cancellazione, limitazione, portabilità, opposizione) **esclusivamente sui propri dati personali** (cfr. § 3.1: nome, cognome, email, dati anagrafici relativi al CAI, consensi), scrivendo ai recapiti del Titolare (CAI) o del Responsabile (Montagna Servizi) indicati in apertura del documento.

Coerentemente con la cessione dei diritti d'uso e con la qualificazione dei dati operata al § 3, è importante distinguere tre piani:

- **Piano dei dati personali dell'Autore (GDPR — sempre revocabili).** L'Autore può richiedere in qualsiasi momento accesso, rettifica, cancellazione, limitazione, portabilità o opposizione sui propri dati anagrafici e di contatto. Su richiesta il sistema rimuove anche l'attribuzione del nome dell'Autore dalle pagine pubbliche delle relative fotografie, sostituendola con una dicitura anonima.
- **Piano dei dati intrinseci delle Opere (cfr. § 3.2 — non revocabili).** Coordinate GPS, data di scatto, regione, provincia, comune, tappa SICAI, titolo e descrizione, file immagine sono parte integrante dell'Opera fotografica ceduta al CAI: non sono qualificabili come dati personali soggetti a cancellazione GDPR, e l'Autore non può richiederne la rimozione, la modifica del posizionamento o il ritiro dalla piattaforma.
- **Piano della concessione dei diritti d'uso sulle Opere (irrevocabile).** Come specificato al § 6.1, la concessione dei diritti d'uso al CAI è irrevocabile: l'Autore non può ritirarla né condizionarla successivamente al caricamento e alla validazione. Le copie già acquisite da terzi in licenza CC BY 4.0 prima dell'eventuale rimozione dalla piattaforma non sono richiamabili.

A tutela dell'Autore, la procedura di **validazione amministrativa** (cfr. § 4.7) consente di intercettare e scartare a monte fotografie inviate per errore o non idonee, prima della loro pubblicazione e della loro entrata definitiva nel patrimonio del CAI. Una volta validata e pubblicata la foto, l'unica via per la sua rimozione è una decisione del CAI in qualità di proprietario del patrimonio.

### 6.5 Discrezionalità del CAI sulla pubblicazione e sull'uso delle Opere

Il CAI conserva piena discrezionalità sulle Opere caricate dagli Autori, in qualità di proprietario del patrimonio iconografico FotoSICAI. In particolare:

- **Nessun obbligo di pubblicazione.** Il CAI non è obbligato a pubblicare le fotografie caricate. La validazione amministrativa (§ 4.7) è un atto discrezionale: il CAI o il soggetto attuatore da esso designato possono decidere di non pubblicare un'Opera, senza obbligo di motivazione e senza che da ciò sorga alcun diritto in capo all'Autore.
- **Diritto di rimozione in qualsiasi momento.** Anche dopo la pubblicazione, il CAI può rimuovere un'Opera dalla piattaforma, non utilizzarla, cessarne l'uso o limitarne la diffusione, a propria insindacabile discrezione e senza obbligo di preavviso o di motivazione.
- **Libertà di destinazione.** Il CAI può decidere come, dove e quando utilizzare le Opere ammesse al patrimonio, scegliendo i canali, i formati, le modalità di diffusione e l'eventuale messa a disposizione di soggetti terzi, nel rispetto delle clausole del documento di consenso.

La mancata pubblicazione, la rimozione, la rinuncia all'uso o qualunque altra decisione del CAI in merito al destino delle Opere non danno luogo ad alcun rimborso, indennizzo o pretesa da parte dell'Autore. Tale discrezionalità è formalmente esposta all'Autore al momento dell'accettazione del consenso (cfr. § 4 del documento `legal/consenso.md`).

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

I **dati personali dell'Autore** (cfr. § 3.1) sono conservati per tutta la durata del progetto FotoSICAI e del contratto affidato a Montagna Servizi (CIG B165634123, 2024-2026), salvo richiesta di cancellazione anticipata da parte dell'interessato ai sensi del GDPR. Alla cessazione del rapporto contrattuale, il CAI in qualità di Titolare deciderà se proseguire il trattamento direttamente o per il tramite di altro soggetto attuatore.

I **dati delle Opere** (cfr. § 3.2: file immagine e metadati intrinseci) sono invece parte del patrimonio iconografico ceduto al CAI in modo irrevocabile e sono conservati a tempo indeterminato, salvo decisioni del CAI in qualità di proprietario. Tale conservazione non è soggetta alle richieste di cancellazione GDPR dell'Autore, in coerenza con quanto descritto ai § 3.2 e § 6.4.

---

## 9. Impegni di Montagna Servizi alla cessazione del contratto

L'incarico affidato a Montagna Servizi S.C.p.A. nell'ambito del **Piano Progetto Sentiero Italia CAI (CIG B165634123, 2024-2026)** ha durata limitata. Alla scadenza naturale del contratto o in caso di sua anticipata cessazione per qualsiasi causa, Montagna Servizi si impegna formalmente a:

- **cedere al CAI l'intero patrimonio digitale** raccolto tramite la piattaforma FotoSICAI — fotografie originali in tutte le risoluzioni, database SQLite o suo equivalente in formato standard, metadati, indicizzazioni per tappa SICAI, log di consenso, log di verifica email e log di validazione amministrativa — in formato aperto e riutilizzabile, accompagnato dalla documentazione tecnica necessaria al subentro;
- **rimuovere ogni riferimento al Club Alpino Italiano e al Sentiero Italia CAI** dalla piattaforma FotoSICAI, dai propri canali di comunicazione (sito istituzionale, social media, materiali promozionali) e dai propri prodotti commerciali, fatta salva la sola documentazione contrattuale che la legge richiede di conservare;
- **disattivare il dominio `fotosicai.montagnaservizi.it`** e gli endpoint pubblici della piattaforma, oppure trasferire dominio e infrastruttura al soggetto indicato dal CAI;
- **non utilizzare più la piattaforma FotoSICAI** né le sue componenti tecniche (codice sorgente, database, modelli AI configurati) **per la raccolta di fotografie del Sentiero Italia CAI**, salvo nuovo accordo formale con il CAI stesso;
- **non rivendicare alcun diritto d'uso esclusivo** sulle Opere caricate dagli Autori né sul patrimonio iconografico complessivo, che resta in proprietà del CAI ai sensi del documento di consenso accettato dagli Autori;
- garantire la **continuità operativa minima per gli Autori** (in particolare la possibilità di esercitare i diritti GDPR) per un periodo congruo di transizione concordato con il CAI.

Tali impegni — recepiti formalmente anche nel testo del documento di consenso accettato dagli Autori (cfr. `legal/consenso.md`, § 7) — costituiscono parte integrante del rapporto fra Montagna Servizi, il CAI e gli Autori, e garantiscono la continuità del progetto FotoSICAI in capo al CAI anche oltre la durata del contratto attuale.

---

*Documento redatto da Montagna Servizi S.C.p.A. per il DPO del Club Alpino Italiano — 2 maggio 2026.*
