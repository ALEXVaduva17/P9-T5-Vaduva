import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SchedulePage({ setView }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [userReservations, setUserReservations] = useState([]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchClasses = fetch('/api/classes').then(res => res.json());
    
    let fetchReservations = Promise.resolve([]);
    if (isAuthenticated && user?.role === "member") {
      const token = localStorage.getItem("token");
      fetchReservations = fetch('/api/reservations/me', {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(res => res.ok ? res.json() : []);
    }

    Promise.all([fetchClasses, fetchReservations])
      .then(([classesData, reservationsData]) => {
        // Sort by scheduled_at
        classesData.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
        setClasses(classesData);
        if (Array.isArray(reservationsData)) {
            setUserReservations(reservationsData.filter(r => r.status === "confirmed").map(r => r.class_id));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [isAuthenticated, user]);

  const handleBook = async (classId) => {
    if (!isAuthenticated) {
      alert("Te rugăm să te loghezi pentru a rezerva o clasă!");
      setView("login");
      return;
    }

    if (user?.role !== "member") {
      alert("Doar membrii pot rezerva clase!");
      return;
    }

    try {
      const res = await fetch("/api/reservations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ class_id: classId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Booking failed");

      alert("Rezervare confirmată cu succes!");
      
      // Refresh classes to update capacity
      const updatedRes = await fetch('/api/classes');
      const updatedData = await updatedRes.json();
      updatedData.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
      setClasses(updatedData);
      setUserReservations(prev => [...prev, classId]);
    } catch (err) {
      alert(`Eroare: ${err.message}`);
    }
  };

  const getDayName = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('ro-RO', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  };

  // Extract unique days and types for filters
  const days = ['All', ...new Set(classes.map(c => getDayName(c.scheduled_at)))];
  const types = ['All', ...new Set(classes.map(c => c.name))];

  const filteredClasses = classes.filter(c => {
    const matchDay = dayFilter === 'All' || getDayName(c.scheduled_at) === dayFilter;
    const matchType = typeFilter === 'All' || c.name === typeFilter;
    return matchDay && matchType;
  });

  return (
    <div className="section">
      <div className="section-container">
        <div className="section-header">
          <h1 className="section-title">Programul Claselor</h1>
          <p className="section-subtitle">Rezervă-ți locul la clasele preferate. Locurile sunt limitate!</p>
        </div>

        <div className="schedule-controls">
          <div className="schedule-filters">
            <select 
              className="filter-select"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
            >
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            
            <select 
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            {filteredClasses.length} clase găsite
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Se încarcă programul...</div>
        ) : (
          <div className="schedule-grid">
            {filteredClasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-card)', borderRadius: '8px' }}>
                Nu am găsit clase pentru filtrele selectate.
              </div>
            ) : (
              filteredClasses.map(c => {
                const isFull = c.reserved_count >= c.capacity;
                const d = new Date(c.scheduled_at);
                const isPast = d < new Date();
                const isBooked = userReservations.includes(c.id);

                return (
                  <div key={c.id} className="class-card" style={{ opacity: isPast ? 0.5 : 1 }}>
                    <div className="class-time">
                      {getTime(c.scheduled_at)}
                    </div>
                    
                    <div className="class-info">
                      <h3>{c.name}</h3>
                      <div className="class-meta">
                        <span>📅 {getDayName(c.scheduled_at)}</span>
                        <span>⏱️ {c.duration_minutes} min</span>
                        <span>📍 {c.facility_name}</span>
                      </div>
                    </div>
                    
                    <div className="class-trainer">
                      <div className="trainer-avatar">
                        {c.trainer_name ? c.trainer_name.charAt(0) : '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Instructor</div>
                        <div style={{ fontWeight: '500' }}>{c.trainer_name}</div>
                      </div>
                    </div>
                    
                    <div className="class-actions">
                      <div className={`capacity-badge ${isFull ? 'full' : ''}`}>
                        {c.reserved_count} / {c.capacity} Ocupat
                      </div>
                      {!isPast && (
                        <button 
                          className={`btn ${isBooked ? 'btn-secondary' : isFull ? 'btn-secondary' : 'btn-accent'}`}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%', marginTop: '0.5rem' }}
                          disabled={isFull || isBooked}
                          onClick={() => handleBook(c.id)}
                        >
                          {isBooked ? 'Înscris' : isFull ? 'Sold Out' : 'Rezervă'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
