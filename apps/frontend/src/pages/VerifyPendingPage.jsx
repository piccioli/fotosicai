import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyPendingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  return (
    <div className="upload-page">
      <h1>Conferma la tua email</h1>
      <div className="step-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 style={{ marginBottom: 12 }}>Foto inviata!</h2>
        <p style={{ fontSize: 15, marginBottom: 8 }}>
          Abbiamo inviato un'email a <strong>{email}</strong>.
        </p>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>
          Clicca il link nell'email per confermare il tuo indirizzo.
        </p>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
          Dopo la conferma, la foto verrà inviata in coda di validazione e sarà pubblicata
          sulla mappa non appena approvata da un amministratore.
        </p>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          La verifica email vale 30 giorni: nelle prossime foto che caricherai dalla stessa email
          non dovrai ripetere questo passaggio.
        </p>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>
          Non hai ricevuto l'email? Controlla la cartella spam o attendi qualche minuto.
        </p>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            Carica un'altra foto
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Vai alla mappa
          </button>
        </div>
      </div>
    </div>
  );
}
