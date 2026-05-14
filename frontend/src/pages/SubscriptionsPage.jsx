import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionsPage({ setView }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ptSessions, setPtSessions] = useState(0);
  const [cycle, setCycle] = useState({
    'Off-Peak': 'Lunar',
    'Student Fit': 'Lunar',
    'Basic': 'Lunar',
    'Premium': 'Lunar',
    'VIP': 'Lunar',
  });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetch('/api/subscriptions/types/public')
      .then(res => res.json())
      .then(data => {
        setPlans(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getFeatures = (planName) => {
    const base = [
      "Acces zonă fitness & forță",
      "Vestiare moderne & dușuri",
      "Wi-Fi gratuit de mare viteză",
    ];

    if (planName.includes("Off-Peak")) {
      return [
        ...base,
        "Acces doar în intervalul 09:00 - 15:00",
        "1 clasă de grup inclusă / lună",
        "Fără acces parcare",
      ];
    }

    if (planName.includes("Student")) {
      return [
        ...base,
        "Acces pe baza carnetului de student (07:00 - 16:00)",
        "2 clase de grup incluse / lună",
        "1 ședință introductivă cu antrenor",
      ];
    }
    
    if (planName.includes("Premium")) {
      return [
        ...base,
        "Acces nelimitat 24/7",
        "Acces GRATUIT la TOATE clasele de grup",
        "Acces saună uscată & umedă",
        "Acces parcare gratuită (nelimitat)",
        "Evaluare corporală & plan nutriție",
        "Prosop gratuit la fiecare vizită",
      ];
    }

    if (planName.includes("VIP")) {
      return [
        ...base,
        "Acces VIP nelimitat 24/7",
        "Acces gratuit la BAZIN DE ÎNOT olimpic",
        "Acces SPA & Saună Premium",
        "Rezervare prioritară la clase",
        "2 ședințe de Personal Training / lună",
        "Invitat gratuit în weekend",
        "Dulap personal rezervat permanent",
      ];
    }
    
    // Basic
    return [
      ...base,
      "Acces full-time în orele de program",
      "2 clase de grup incluse / lună",
      "Acces parcare gratuită (2h)",
    ];
  };

  const handleBuy = async (planId) => {
    if (!isAuthenticated) {
      setView('login');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/subscriptions/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type_id: planId, pt_sessions: ptSessions })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Nu s-a putut efectua plata.");
      }
      alert("Plată realizată cu succes! Abonamentul este acum activ.");
      setView('dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  const basePlans = ['Off-Peak', 'Student Fit', 'Basic', 'Premium', 'VIP'];

  return (
    <div className="section">
      <div className="section-container">
        <div className="section-header">
          <h1 className="section-title">Alege Planul Perfect</h1>
          <p className="section-subtitle">Investește în sănătatea ta. Abonamente flexibile create pentru obiectivele tale.</p>
        </div>

        {/* PT Sessions Personalization */}
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', marginBottom: '3rem', border: '1px solid var(--border-card)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Personalizează-ți antrenamentul</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Adaugă ședințe de Personal Training (50 RON / ședință)</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <button 
              className="btn btn-outline btn--sm" 
              onClick={() => setPtSessions(Math.max(0, ptSessions - 1))}
              style={{ width: '40px', height: '40px', fontSize: '1.5rem', padding: 0 }}
            >
              -
            </button>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '120px' }}>
              {ptSessions} Ședințe
            </div>
            <button 
              className="btn btn-outline btn--sm" 
              onClick={() => setPtSessions(ptSessions + 1)}
              style={{ width: '40px', height: '40px', fontSize: '1.5rem', padding: 0 }}
            >
              +
            </button>
          </div>
          <div style={{ marginTop: '1rem', color: 'var(--accent)', fontWeight: 'bold' }}>
            Cost suplimentar: {ptSessions * 50} RON / lună
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Se încarcă abonamentele...</div>
        ) : (
          <div className="pricing-grid">
            {basePlans.map(baseName => {
              const selectedCycle = cycle[baseName] || 'Lunar';
              const plan = plans.find(p => p.name === `${baseName} ${selectedCycle}`);
              if (!plan) return null;

              const isPremium = baseName === 'Premium';

              return (
                <div key={baseName} className={`pricing-card ${isPremium ? 'premium' : ''}`}>
                  <div className="pricing-header">
                    <h3 className="pricing-name">{baseName}</h3>
                    <div className="pricing-price">
                      {parseFloat(plan.base_fee) + (ptSessions * 50)}
                      <span className="pricing-currency"> RON</span>
                    </div>
                    <div className="pricing-duration">Valabil {plan.duration_days} zile</div>
                  </div>
                  
                  <ul className="pricing-features">
                    {getFeatures(baseName).map((feature, idx) => (
                      <li key={idx} className="pricing-feature">
                        <i>✓</i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Toggle Switcher */}
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-card)' }}>
                    <button 
                      type="button"
                      onClick={() => setCycle({...cycle, [baseName]: 'Lunar'})}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: selectedCycle === 'Lunar' ? 'var(--accent)' : 'transparent', color: selectedCycle === 'Lunar' ? 'white' : 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' }}
                    >
                      Lunar
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCycle({...cycle, [baseName]: 'Anual'})}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: selectedCycle === 'Anual' ? 'var(--accent)' : 'transparent', color: selectedCycle === 'Anual' ? 'white' : 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' }}
                    >
                      Anual (-10%)
                    </button>
                  </div>

                  <button 
                    className={`btn ${isPremium ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%' }}
                    onClick={() => handleBuy(plan.id)}
                  >
                    {isAuthenticated ? "Cumpără Acum" : "Loghează-te pentru a cumpăra"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
