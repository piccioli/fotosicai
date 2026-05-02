- [X] Revisione helper dei campi in funzione CAI, specificare meglio perché indirizzo email

- [X] Controllare meccanismo di salvataggio dei dati (flag acceso/spento)

- [X] Migliorare flag consenso: uno obbligatorio con tutto quello che si deve accettare, uno facoltativo che autorizza MontagnaServizi a ricontattare l'utente per comunicazioni che riguardano il SICAI (da mettere solo se utente non è presente nel DB).

- [X] Email: Migliorare il testo della email ricevuta facendo riferimento all'incarico di Montagna Servizi per SICAI, Aggiungere tutti i dati che ha selezionato utente nello step 1., nel popup di verifica della email metti due bottoni "Carica nuove foto" "Chiudi". Backend: in users aggiungere campo consenso email

- [X] Backend: users/ aggiungere campo data di convalida email

- [X] Backend: users/ aggiungere flag consenso e flag conseso ad essere ricontattati

- [X] Backend: users/ aggiungere funzionalità per scaricare XLS di tutti gli utenti presenti

# PROGRESS


# TODO

- [ ] Upload multiplo: implementare funzionalità per caricare più foto contemporaneamente. Nello Step 1. deve essere possibile selezionare più foto contemporaneamente che vengono mostrate come thubnail (anche una sola), nel caso in cui le foto selezionate siano più di una: lo step 2 e 3 deve essere ripetuto per ciascuna foto, nel riepilogo si devono mostrare tutte le foto selezionate con unico tasto publica.

- [ ] Stress test: script stress_test che aggiunge X user e Y +/- 10% (random) foto per user sparse in un buffer di 500 m del SICAI in tutta italia, l'immagine la prende da fixtures, email e altri dati te li devi inventare, i dati aggiuntivi della immagine (titolo + descrizione) inventali random senza chiamare AI

- [ ] Aggiungere documentazione .md e PDF anche per DPO CAI + email da mandare a resp. CAI (su carta intestata Montagna Servizi / SICAI)

====== GOLIVE DOPO ACCETTAZIONE CAI ========

- [ ] Nello step 1. Aggiungere dati utente: soscio si/no, se socio selezionare la sezione (da select con autocomplete), campo per ruolo/titolo nel cai, referente sicai di tappa/regionale si/no, se si indicare regione o tappa. Questi dati devono essere visualizzati assieme agli altri accanto all'autore tra parentesi

- [ ] Migliorare il funzionamento da mobile (UI)

- [ ] Migliorare l'interfaccia di visualizzazione della mappa con tutte le foto

- [ ] Migliorare l'interfaccia di visualizzazione della funzionalità di ricerca con filtro


# DONE
- [X] Processo di validazione: pubblicare solo foto accettate dal backend. Aggiungere un campo alle foto che riguarda la validazione da parte di un amministratore che accede al backend. Dividere lo stato di verifica email (non verificato / verificato) dallo stato di validazione della email (validato / non validato ). Solo le foto con email verificata e validate vengono publicate sul frontend.

- [X] Admin web UI: interfaccia admin su /admin con login da .env, dashboard statistiche, elenco utenti, elenco foto con filtri, elimina foto

- [X] Processo di validazione: pubblicare solo foto inviate da indirizzo email validato. (per testare il funzionamento in locale voglio usare mailpit configurazione in .env, in produzione voglio usare gmail, configurazione in .env)

- [X] Legal: termini e condizioni, cessione della proprietà al CAI
