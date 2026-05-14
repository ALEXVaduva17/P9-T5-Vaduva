import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function TrainersPage({ setView }) {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [booking, setBooking] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetch('/api/trainers')
      .then(res => res.json())
      .then(data => {
        setTrainers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Te rugăm să te loghezi pentru a rezerva o ședință privată!");
      setView("login");
      return;
    }

    if (user?.role !== "member") {
      alert("Doar membrii pot rezerva ședințe cu instructorii!");
      return;
    }

    setBooking(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/trainers/${selectedTrainer.id}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ scheduled_at: new Date(scheduledAt).toISOString() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Booking failed");

      alert("Ședință rezervată cu succes! Poți vedea detaliile în Dashboard-ul tău.");
      setSelectedTrainer(null);
      setScheduledAt("");
    } catch (err) {
      alert(`Eroare: ${err.message}`);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="section">
      <div className="section-container">
        <div className="section-header">
          <h1 className="section-title">Echipa Noastră de Instructori</h1>
          <p className="section-subtitle">Alege antrenorul potrivit obiectivelor tale și programează o ședință 1 la 1.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Se încarcă instructorii...</div>
        ) : (
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {trainers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1/-1', background: 'var(--bg-card)', borderRadius: '8px' }}>
                Nu am găsit instructori disponibili în acest moment.
              </div>
            ) : (
              trainers.map(t => (
                <div key={t.id} className="card plan-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 auto 1.5rem', color: 'white' }}>
                      {t.name.charAt(0)}
                    </div>
                    <h3 style={{ textAlign: 'center', fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>{t.name}</h3>
                    <div style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: '500', marginBottom: '1rem' }}>
                      {t.specialization || 'Antrenor Personal'}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'center', marginBottom: '1.5rem' }}>
                      {t.bio || 'Antrenor dedicat să te ajute să îți atingi potențialul maxim.'}
                    </p>
                  </div>
                  
                  <button
                    className="btn btn-accent"
                    style={{ width: '100%', padding: '0.75rem' }}
                    onClick={() => setSelectedTrainer(t)}
                  >
                    Programează Ședință
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTrainer && (
          <div className="modal-overlay" onClick={() => setSelectedTrainer(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                Rezervă Ședință cu {selectedTrainer.name}
              </div>
              <form onSubmit={handleBookSession} className="modal-form">
                <div className="form-group">
                  <label>Alege Data și Ora</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    required
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setSelectedTrainer(null)}>Anulează</button>
                  <button type="submit" className="btn btn-accent" disabled={booking}>
                    {booking ? 'Se rezervă...' : 'Confirmă Rezervarea'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
