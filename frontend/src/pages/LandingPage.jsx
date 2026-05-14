import React, { useState, useEffect } from 'react';

export default function LandingPage({ setView }) {
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    fetch('/api/trainers')
      .then(res => res.json())
      .then(data => setTrainers(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="landing-page">
      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="glow-orb glow-orb-1"></div>
          <div className="glow-orb glow-orb-2"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">✨ Nou: Aplicația oficială Fitness Center</div>
          <h1 className="hero-title">
            Depășește-ți <span className="brand-accent">Limitele</span>
          </h1>
          <p className="hero-subtitle">
            Alătură-te celui mai modern centru de fitness. Echipamente premium, antrenori de top și zeci de clase pentru a-ți atinge obiectivele.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => setView("subscriptions")}>
              Vezi Abonamentele
            </button>
            <button className="btn btn-outline" onClick={() => setView("schedule")}>
              Program Clase
            </button>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="section" id="features">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Facilități Premium</h2>
            <p className="section-subtitle">Tot ce ai nevoie pentru un antrenament complet, la cele mai înalte standarde.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏋️</div>
              <h3 className="feature-title">Echipamente de Top</h3>
              <p className="feature-desc">Aparate de ultimă generație de la producători de top, întreținute impecabil pentru siguranța ta.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏃</div>
              <h3 className="feature-title">Clase de Grup</h3>
              <p className="feature-desc">Peste 40 de clase pe săptămână: Yoga, Spinning, HIIT, CrossFit și multe altele.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3 className="feature-title">Antrenori Personali</h3>
              <p className="feature-desc">Profesioniști certificați pregătiți să te ajute cu planuri de antrenament și nutriție personalizate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trainers Section ── */}
      <section className="section" id="trainers" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Echipa Noastră</h2>
            <p className="section-subtitle">Cunoaște antrenorii care te vor ghida pe drumul spre cea mai bună versiune a ta.</p>
          </div>
          <div className="trainers-grid">
            {trainers.slice(0, 4).map(trainer => (
              <div key={trainer.id} className="trainer-card">
                <div className="trainer-img">
                  {/* Placeholder icon based on specialization */}
                  {trainer.specialization.includes('Yoga') ? '🧘' : 
                   trainer.specialization.includes('Box') ? '🥊' : 
                   trainer.specialization.includes('CrossFit') ? '🤸' : '🏋️'}
                </div>
                <div className="trainer-info">
                  <h3 className="trainer-name">{trainer.name}</h3>
                  <div className="trainer-spec">{trainer.specialization}</div>
                  <p className="trainer-bio">{trainer.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
