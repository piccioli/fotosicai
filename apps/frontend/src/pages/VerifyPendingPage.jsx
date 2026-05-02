import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyPendingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const emailSent = searchParams.get('email_sent') !== 'false';
  const count = parseInt(searchParams.get('count') || '1', 10);

  return (
    <div className="upload-page">
      <h1>Conferma la tua email</h1>
      <div className="step-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 style={{ marginBottom: 12 }}>
          {emailSent
            ? (count > 1 ? `${count} foto inviate!` : 'Foto inviata!')
            : (count > 1 ? `${count} foto aggiunte!` : 'Foto aggiunta!')}
        </h2>
        <p style={{ fontSize: 15, marginBottom: 8 }}>
          {emailSent
            ? <>Abbiamo inviato un'email a <strong>{email}</strong>.</>
            : <>Hai già un'email di verifica in sospeso per <strong>{email}</strong>.</>}
        </p>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>
          Clicca il link nell'email per confermare il tuo indirizzo.
        </p>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
          Cliccando il link verranno confermate <strong>tutte le foto</strong> caricate con questa email.
          Dopo la conferma, le foto verranno sottoposte a validazione da parte del <strong>team SICAI</strong> prima di essere pubblicate sulla mappa.
        </p>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          La verifica email vale {import.meta.env.VITE_EMAIL_VERIFICATION_TRUST_DAYS || 30} giorni: nelle prossime foto che caricherai dalla stessa email
          non dovrai ripetere questo passaggio.
        </p>
        {emailSent && (
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>
            Non hai ricevuto l'email? Controlla la cartella spam o attendi qualche minuto.
          </p>
        )}
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            Carica altre foto
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Vai alla mappa
          </button>
        </div>
      </div>
    </div>
  );
}
