# PROGRESS

- [ ] Migliorare il prompt AI in base alla distanza dal percorso.
- [ ] Aggiungere documentazione .md e PDF anche per DPO CAI + email da mandare a resp. CAI (su carta intestata Montagna Servizi / SICAI)

# TODO

====== GOLIVE DOPO ACCETTAZIONE CAI ========

# BACKLOG

- [ ] SYS: al GOLIVE impostare procedura di backup HETZNER
- [ ] SYS: impostare procedura di backup puntale (DB + dati) riutilizzabile comre restore su ambiente simile
- [ ] SYS: al GOLIVE predisporre anche un ambiente UAT (User Acceptance Test) con indirizzo fotosicaiuat.montagnaservizi.it che abbia uno script che copia una volta al giorno i dati di produzione (DB + link sym x le immagini)
- [ ] DOCS: aggiungere nel readme le indicazioni relative allo stress test e alla occupazione prevista (10.000 foto -> 10 Gb di storage + 30 Mb di DB)
- [ ] Legal: Procedura di eliminazione autore / Anonimizzazione foto
- [ ] (EPIC) Frontend: Migliorare il funzionamento da mobile (UI)
- [ ] (EPIC) Migliorare l'interfaccia di visualizzazione della mappa con tutte le foto
- [ ] (EPIC) Migliorare l'interfaccia di visualizzazione della funzionalità di ricerca con filtro

# IDEAS

# DONE

- [X] Backend UX: /users paginazione dei risultati, paginazione visibile sempre in fondo alla pagina
- [X] Backend UX: /foto paginazione dei risultati, paginazione visibile sempre in fondo alla pagina
- [X] Backend UX: menu, le due voci di menu in basso ("Esci" e "Mappa") devono essere sempre visibili anche se la pagina è lunga 
- [X] Frontend: Nel dettaglio publico della immagine mettere anche la mappa con la posizione della foto e la traccia SICAI visibile 
per come deve essere citata la fonte
- [X] Backend: Nella dashboard mettere "Distribuzione per tappa" in ordine decrescente
- [X] Backend: Nella dashboard mettere "Distribuzione per regione" in ordine decrescente
- [X] Backend: Nella dashboard aggiungere Blocco relativo a "Regioni mancanti"
- [X] Backend: Nella dashboard aggiungere Blocco relativo a "Tappe Mancanti"
- [X] Backend: Nella dashboard aggiungere blocchi relativo agli utenti: numero totale di utenti / numero utenti validati / non validati / classifica dei primi 10 utenti
- [X] Frontend: Nel dettaglio publico della immagine mettere un testo copiabile 
- [X] Frontend: Nel dettaglio publico della immagine mettere link per scaricare la immagine

- [X] Upload multiplo: implementare funzionalità per caricare più foto contemporaneamente. Nello Step 1. deve essere possibile selezionare più foto contemporaneamente che vengono mostrate come thubnail (anche una sola), nel caso in cui le foto selezionate siano più di una: lo step 2 e 3 deve essere ripetuto per ciascuna foto, nel riepilogo si devono mostrare tutte le foto selezionate con unico tasto publica.

- [X] Upload multiplo: modifica UX del campo in cui si dice che è possibile fare anche il drag and drop (bottone)

- [X] Inverti step 4 e 5: il 4 deve diventare riepilogo e il 5 accettazione + publica

- [X] Miglioramento dello step 4: nel riepilogo per ciascuna foto, deve essere presente un bottone che permette di modificare eventualmente i dati: apre una modale con thumb della foto, mappa che permette di modificare la posizione (cambia quindi anche regione / provincia / comnune), campi titolo e descrizione modificabili, bottone di conferma e chiudi che mostra i dati aggiornati della foto modificata

- [X] Stress test: script stress_test che aggiunge X user e Y (+/- 10% random) foto per user sparse in un buffer di 500 m del SICAI in tutta italia, l'immagine la prende da fixtures, email e altri dati te li devi inventare, i dati aggiuntivi della immagine (titolo + descrizione) inventali random senza chiamare AI

- [X] Upload multiplo: Thumbnail al caricamento. Oltre a GPX ok (verde) / non ok se il GPS non è presente (rosso), aggiungere anche uno stato in cui GPX in grigio per quelle foto che hanno GPX presente ma sono fuori dal buffer SICAI (VITE_STAGE_MAX_DISTANCE_M)

- [X] Upload multiplo: revisione del flusso di caricamento in base alla presenza di foto con GPX ok e dentro il buffer SICAI (VITE_STAGE_MAX_DISTANCE_M), piuttosto che foto che non sono nelle consizioni di cui sopra. 
CASO1: TUTTE le foto sono con GPX OK e dentro il buffer SICAI -> si passa dallo step1. allo step 4. (revisione) con una finestra intermedia in cui vengono effettuate tutte le chiamate AI per aggiungere titolo e descrizione
CASO2: ci sono ALCUNE foto che non sono nella condizione GPX OK + buffer SICAI ok. Prima di passa per le foto che non sono nella condizione si revisionano gli step 2 e 3 al termine di questa revisione si lancia arricchimento AI per tutte le foto che hanno GPX + buffer SICAI ok e si manda alla revisione nello step 4 per tutte le foto caricate

- [X] Revisione helper dei campi in funzione CAI, specificare meglio perché indirizzo email

- [X] Controllare meccanismo di salvataggio dei dati (flag acceso/spento)

- [X] Migliorare flag consenso: uno obbligatorio con tutto quello che si deve accettare, uno facoltativo che autorizza MontagnaServizi a ricontattare l'utente per comunicazioni che riguardano il SICAI (da mettere solo se utente non è presente nel DB).

- [X] Email: Migliorare il testo della email ricevuta facendo riferimento all'incarico di Montagna Servizi per SICAI, Aggiungere tutti i dati che ha selezionato utente nello step 1., nel popup di verifica della email metti due bottoni "Carica nuove foto" "Chiudi". Backend: in users aggiungere campo consenso email

- [X] Backend: users/ aggiungere campo data di convalida email

- [X] Backend: users/ aggiungere flag consenso e flag conseso ad essere ricontattati

- [X] Backend: users/ aggiungere funzionalità per scaricare XLS di tutti gli utenti presenti

- [X] Nello step 1. Aggiungere dati utente: soscio si/no, se socio selezionare la sezione (da select con autocomplete), campo per ruolo/titolo nel cai, referente sicai di tappa/regionale si/no, se si indicare regione o tappa. Questi dati devono essere visualizzati assieme agli altri accanto all'autore tra parentesi

- [X] Processo di validazione: pubblicare solo foto accettate dal backend. Aggiungere un campo alle foto che riguarda la validazione da parte di un amministratore che accede al backend. Dividere lo stato di verifica email (non verificato / verificato) dallo stato di validazione della email (validato / non validato ). Solo le foto con email verificata e validate vengono publicate sul frontend.

- [X] Admin web UI: interfaccia admin su /admin con login da .env, dashboard statistiche, elenco utenti, elenco foto con filtri, elimina foto

- [X] Processo di validazione: pubblicare solo foto inviate da indirizzo email validato. (per testare il funzionamento in locale voglio usare mailpit configurazione in .env, in produzione voglio usare gmail, configurazione in .env)

- [X] Legal: termini e condizioni, cessione della proprietà al CAI
