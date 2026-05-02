# FotoSICAI — Richiesta di accettazione delle condizioni

**Documento informativo per il DPO del Club Alpino Italiano**

| | |
|---|---|
| **Titolare del trattamento** | Club Alpino Italiano (CAI) |
| **Responsabile del trattamento** | Montagna Servizi S.C.p.A. |
| **Versione consenso** | 2026-05-01 |
| **Punto di raccolta consenso** | Step 5 del flusso di upload — `/upload`, sezione "Consenso e pubblicazione" |
| **Endpoint API** | `GET /api/legal/consent` |

---

## 1. Premessa

Questo documento riporta integralmente il testo che viene presentato all'utente (di seguito "Autore") nello Step 5 del flusso di upload della piattaforma FotoSICAI, e descrive i due flag di consenso che l'Autore deve gestire per poter pubblicare le fotografie. Il testo che segue è quello effettivamente esposto in produzione (file `legal/consenso.md`, versione 2026-05-01) ed è recuperabile in qualunque momento dall'API pubblica `/api/legal/consent`.

Il consenso è obbligatorio: senza spunta sul flag obbligatorio l'Autore non può inviare le fotografie. Versione del documento accettato e data/ora dell'accettazione sono memorizzate nel database insieme al record utente, per finalità di tracciabilità.

---

## 2. Testo integrale del documento di consenso (versione 2026-05-01)

> # Autorizzazione alla pubblicazione e licenza d'uso delle opere fotografiche
>
> Con l'invio delle immagini tramite la piattaforma FotoSICAI, l'Autore dichiara di aver letto e accettato integralmente il presente testo.
>
> ## 1. Soggetto autorizzato
>
> L'Autore concede autorizzazione al **Club Alpino Italiano (CAI)**, con sede legale in Milano, via E. Petrella 19, a utilizzare le fotografie aventi come soggetto il Sentiero Italia CAI (di seguito, "Opere"), caricate sulla piattaforma FotoSICAI.
>
> ## 2. Dichiarazioni dell'Autore
>
> L'Autore dichiara e garantisce:
>
> - di essere l'unico autore e titolare dei diritti sulle Opere caricate;
> - che le Opere sono originali e non violano diritti di terzi;
> - di avere acquisito, ove necessario, le eventuali liberatorie delle persone ritratte;
> - di caricare le Opere a titolo gratuito, senza richiesta di compensi economici.
>
> ## 3. Autorizzazione d'uso da parte del CAI
>
> L'Autore autorizza il CAI, in forma non esclusiva, gratuita, a tempo illimitato e senza limiti territoriali, a:
>
> - utilizzare, riprodurre, pubblicare e diffondere le Opere, in tutto o in parte, su siti web, social media, riviste, libri, materiali promozionali, mostre e altri canali istituzionali;
> - mettere le Opere a disposizione di soggetti terzi (es. Enti Parco, Regioni, partner, testate giornalistiche, enti di promozione turistica) esclusivamente per finalità promozionali, informative o istituzionali legate al Sentiero Italia CAI;
> - utilizzare le Opere senza fini di lucro.
>
> Il CAI si impegna, ove tecnicamente possibile, a citare il nome dell'Autore.
>
> ## 4. Licenza pubblica delle fotografie
>
> L'Autore accetta che le Opere pubblicate sulla piattaforma FotoSICAI siano rilasciate con licenza:
>
> **Creative Commons Attribution 4.0 International (CC BY 4.0)**
> Testo licenza: https://creativecommons.org/licenses/by/4.0/
>
> La licenza CC BY 4.0 consente a chiunque di condividere e adattare le Opere, anche per usi commerciali, con obbligo di attribuzione dell'autore.
>
> ## 5. Informativa privacy (GDPR)
>
> I dati personali conferiti (es. nome/cognome autore, contatti, metadati foto, coordinate GPS, data e ora di scatto) sono trattati dal CAI ai fini della gestione del rapporto di collaborazione, pubblicazione dei contenuti e corretta attribuzione dei crediti fotografici, in conformità al Regolamento UE 2016/679 (GDPR).
>
> ## 6. Accettazione esplicita
>
> Proseguendo con la pubblicazione, l'Autore conferma:
>
> - di aver preso visione del presente documento;
> - di autorizzare l'uso delle Opere come sopra descritto;
> - di accettare il rilascio delle Opere con licenza **CC BY 4.0**.
>
> ---
>
> *Versione: 2026-05-01*

---

## 3. Flag di consenso esposti nell'interfaccia

Nel form di pubblicazione l'Autore visualizza fino a due checkbox distinte, in coerenza con il principio di granularità del consenso (art. 7 GDPR):

### 3.1 Flag obbligatorio (sempre presente)

> ☐ Ho letto e accetto il documento di **Autorizzazione alla pubblicazione e licenza d'uso delle opere fotografiche** (versione 2026-05-01). Confermo di essere l'autore delle fotografie caricate, autorizzo il Club Alpino Italiano a utilizzarle per finalità istituzionali e promozionali del Sentiero Italia CAI, e accetto il rilascio pubblico con licenza Creative Commons Attribution 4.0 International (CC BY 4.0).

Il flag è disabilitato di default. Senza la spunta, il pulsante "Pubblica" resta inattivo. La spunta viene memorizzata nel database insieme alla versione del documento (`consent_version = "2026-05-01"`) e al timestamp.

### 3.2 Flag facoltativo (solo per nuovi Autori)

Esposto **solo** se l'indirizzo email non è già presente nel database (cioè se l'Autore non ha già espresso o negato in passato questa preferenza):

> ☐ Autorizzo Montagna Servizi S.C.p.A., in qualità di soggetto attuatore per il Sentiero Italia CAI, a contattarmi all'indirizzo email indicato per comunicazioni inerenti il SICAI e il progetto FotoSICAI (es. nuove iniziative di raccolta fotografica, mostre, pubblicazioni, eventi). Posso revocare il consenso in qualunque momento scrivendo a info@montagnaservizi.com.

Il flag è facoltativo: la sua mancata spunta non impedisce la pubblicazione delle fotografie. Il valore (true/false) viene salvato nel campo `email_recontact_consent` del record utente.

---

## 4. Verifica e validazione successive

L'accettazione del consenso non è da sola sufficiente alla pubblicazione: il flusso prevede due ulteriori passaggi obbligatori, descritti in dettaglio nel documento "FotoSICAI — Flusso di upload e proprietà del dato".

**Verifica email.** Dopo la pubblicazione, l'Autore riceve un'email con un link di conferma. Il messaggio fa riferimento esplicito all'incarico di Montagna Servizi per il SICAI, riepiloga i dati anagrafici inseriti dall'Autore, elenca le foto in attesa di pubblicazione e invita a confermare l'indirizzo. Solo dopo il click sul link l'indirizzo viene marcato come verificato (`email_verified_at`).

**Validazione amministrativa.** Le foto con email verificata entrano in coda di validazione nel backoffice `/admin`. Un amministratore Montagna Servizi può approvare, rifiutare o cancellare ciascuna foto. Solo le foto **email-verified e validated** sono pubblicate sulla mappa pubblica e nei risultati di ricerca.

---

## 5. Revoca del consenso e diritti dell'Autore

In ogni momento l'Autore può:

- richiedere la cancellazione di una o più fotografie scrivendo ai recapiti del Titolare (CAI) o del Responsabile (Montagna Servizi);
- revocare il consenso facoltativo al ricontatto, scrivendo a `info@montagnaservizi.com`;
- esercitare i diritti previsti dagli articoli 15-22 GDPR (accesso, rettifica, cancellazione, limitazione, portabilità, opposizione).

La revoca del consenso non pregiudica la liceità del trattamento basato sul consenso prima della revoca. Le copie di fotografie già diffuse a terzi in licenza CC BY 4.0 prima della cancellazione non sono richiamabili, in coerenza con la natura della licenza pubblica accettata al momento del caricamento.

---

## 6. Tracciabilità del consenso

Per ogni Autore registrato il sistema memorizza:

- versione del documento di consenso accettata (campo `consent_version`);
- data/ora di accettazione (campo `consent_at`);
- valore del flag di ricontatto facoltativo (`email_recontact_consent`);
- data/ora di verifica dell'indirizzo email (`email_verified_at`);
- esito della validazione amministrativa per ciascuna fotografia caricata.

In caso di aggiornamento del documento di consenso, la nuova versione viene esposta con un nuovo identificativo (`consent_version`); gli Autori che caricano nuove fotografie successivamente all'aggiornamento dovranno accettare la nuova versione.

---

*Documento redatto da Montagna Servizi S.C.p.A. per il DPO del Club Alpino Italiano — 2 maggio 2026.*
