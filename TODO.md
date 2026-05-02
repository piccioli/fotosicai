
# TODO

- [ ] Revisione helper dei campi in funzione CAI, specificare meglio perché indirizzo email

# PROGRESS


- [ ] Migliorare flag consenso: uno obbligatorio con tutto quello che si deve accettare, uno facoltativo che autorizza MontagnaServizi a ricontattare l'utente per comunicazioni che riguardano il SICAI

- [ ] Migliorare il testo della email ricevuta facendo riferimento all'incarico di Montagna Servizi per SICAI

- [ ] Backend: users/ aggiungere campo data di convalida email

- [ ] Backend: users/ aggiungere flag consenso e flag conseso ad essere ricontattati

- [ ] Backend: users/ aggiungere funzionalità per scaricare XLS di tutti gli utenti presenti

- [ ] Upload multiplo: funzionalità per caricare più foto contemporaneamente

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
