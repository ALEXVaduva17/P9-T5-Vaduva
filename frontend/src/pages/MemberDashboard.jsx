import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

function MemberDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trainerSessions, setTrainerSessions] = useState([]);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchSub = async () => {
      try {
        const res = await fetch("/api/subscriptions/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch subscription");
        const result = await res.json();
        setData(result);

        const profRes = await fetch("/api/members/profile/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (profRes.ok) {
          const profResult = await profRes.json();
          setProfile(profResult);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchReservations = async () => {
      try {
        const res = await fetch("/api/reservations/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setReservations(result);
        }
      } catch (err) {
        console.error("Failed to fetch reservations", err);
      }
    };

    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/payments/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setPayments(result);
        }
      } catch (err) {
        console.error("Failed to fetch payments", err);
      }
    };

    const fetchTrainerSessions = async () => {
      try {
        const res = await fetch("/api/trainers/sessions/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setTrainerSessions(result);
        }
      } catch (err) {
        console.error("Failed to fetch trainer sessions", err);
      }
    };

    fetchSub();
    fetchReservations();
    fetchPayments();
    fetchTrainerSessions();
  }, [token]);

  const handleCancelReservation = async (id) => {
    if (!window.confirm("Ești sigur că vrei să anulezi această rezervare?")) return;
    
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "A apărut o eroare la anulare.");
      }
      
      setReservations(reservations.map(r => 
        r.id === id ? { ...r, status: "cancelled" } : r
      ));
      alert("Rezervare anulată cu succes.");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelTrainerSession = async (id) => {
    if (!window.confirm("Ești sigur că vrei să anulezi această ședință?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/trainers/sessions/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "A apărut o eroare la anulare.");
      }
      
      setTrainerSessions(trainerSessions.map(s => 
        s.id === id ? { ...s, status: "cancelled" } : s
      ));
      alert("Ședință anulată cu succes.");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelSub = async () => {
    if (!window.confirm("Ești sigur că vrei să anulezi abonamentul curent?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/subscriptions/me", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Eroare la anulare abonament");
      alert("Abonament anulat cu succes.");
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProfile = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/members/profile/me", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Eroare la actualizare profil");
      alert("Profil actualizat cu succes!");
      window.location.reload();
    } catch (err) {
      throw err;
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Se încarcă profilul...</div>;
  if (error) return <div style={{ padding: "2rem", color: "var(--danger)" }}>{error}</div>;

  const sub = data?.subscription;
  const statusClass = {
    active: "badge--active",
    none: "badge--none",
    expired: "badge--expired",
    restricted: "badge--restricted",
  }[data?.subscription_status] || "badge--none";

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1 className="page-title">Panou Membru</h1>
        <p className="page-subtitle">Gestionează-ți abonamentul și rezervările la clase</p>
      </div>

      {/* ── Welcome card ── */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="Profile" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--accent)" }} />
            ) : (
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold" }}>
                {data?.member_name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem", margin: 0 }}>{data?.member_name || "Unknown"}</h2>
              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{profile?.email} | {profile?.phone}</div>
              <span className={`badge ${statusClass}`} style={{ marginTop: "0.5rem", display: "inline-block" }}>
                {data?.subscription_status || "none"}
              </span>
            </div>
          </div>
          <button className="btn btn-outline" onClick={() => setShowEditProfileModal(true)}>
            ✏️ Editează Profilul
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
        {/* ── Subscription card ── */}
        {sub ? (
          <div className="card sub-card">
            <div className="card-title">
              <span>⭐</span> Abonament Activ
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
              <div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Tip Plan</div>
                <div style={{ fontWeight: "600" }}>{sub.type}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Cost Bază</div>
                <div style={{ fontWeight: "600" }}>{parseFloat(sub.base_fee).toFixed(2)} RON</div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Ședințe PT</div>
                <div style={{ fontWeight: "600" }}>{sub.pt_sessions}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Cost Total</div>
                <div style={{ fontWeight: "600", color: "var(--accent-light)" }}>
                  {parseFloat(sub.total_amount).toFixed(2)} RON
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Data Începerii</div>
                <div style={{ fontWeight: "600" }}>{new Date(sub.start_date).toLocaleDateString("ro-RO")}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Data Expirării</div>
                <div style={{ fontWeight: "600" }}>{new Date(sub.end_date).toLocaleDateString("ro-RO")}</div>
              </div>
            </div>

            {/* ── Days remaining ── */}
            <DaysRemaining endDate={sub.end_date} />

            <button 
              onClick={handleCancelSub} 
              className="btn btn-outline" 
              style={{ width: "100%", marginTop: "1.5rem", borderColor: "var(--danger)", color: "var(--danger)" }}
            >
              Anulează Abonamentul
            </button>
          </div>
        ) : (
          <div className="card">
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💪</div>
              <p>Nu ai un abonament activ momentan.</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                Accesează secțiunea Abonamente pentru a alege un plan.
              </p>
            </div>
          </div>
        )}

        {/* ── Reservations card ── */}
        <div className="card">
          <div className="card-title">
            <span>📅</span> Rezervările Mele
          </div>
          
          {reservations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
              Nu ai nicio clasă rezervată în acest moment.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "350px", overflowY: "auto", paddingRight: "0.5rem" }}>
              {reservations.map(res => {
                const isPast = new Date(res.scheduled_at) < new Date();
                const isCancelled = res.status === "cancelled";
                return (
                  <div key={res.id} style={{ padding: "1rem", borderRadius: "8px", background: "var(--bg-card-hover)", border: "1px solid var(--border-card)", opacity: isPast || isCancelled ? 0.6 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: "600" }}>{res.class_name}</h4>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                          {new Date(res.scheduled_at).toLocaleString("ro-RO", { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className={`badge ${isCancelled ? 'badge--expired' : 'badge--active'}`}>
                        {res.status}
                      </span>
                    </div>
                    
                    {!isPast && !isCancelled && (
                      <button 
                        onClick={() => handleCancelReservation(res.id)}
                        className="btn btn-outline" 
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", marginTop: "0.75rem", width: "100%" }}
                      >
                        Anulează Rezervarea
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* ── Payments History card ── */}
        <div className="card">
          <div className="card-title">
            <span>💳</span> Istoric Tranzacții
          </div>
          
          {payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
              Nu ai nicio tranzacție efectuată.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "350px", overflowY: "auto", paddingRight: "0.5rem" }}>
              {payments.map(payment => (
                <div key={payment.id} style={{ padding: "1rem", borderRadius: "8px", background: "var(--bg-card-hover)", border: "1px solid var(--border-card)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: "600" }}>{payment.amount.toFixed(2)} {payment.currency}</h4>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      Ref: {payment.gateway_session_id?.substring(0, 8) || "N/A"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge ${payment.status === 'success' ? 'badge--active' : 'badge--warning'}`}>
                      {payment.status}
                    </span>
                    {payment.paid_at && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        {new Date(payment.paid_at).toLocaleDateString("ro-RO")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Trainer Sessions card ── */}
        <div className="card">
          <div className="card-title">
            <span>💪</span> Ședințe Antrenor Personal
          </div>
          
          {trainerSessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
              Nu ai nicio ședință privată programată.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "350px", overflowY: "auto", paddingRight: "0.5rem" }}>
              {trainerSessions.map(session => {
                const isPast = new Date(session.scheduled_at) < new Date();
                const isCancelled = session.status === "cancelled";
                return (
                  <div key={session.id} style={{ padding: "1rem", borderRadius: "8px", background: "var(--bg-card-hover)", border: "1px solid var(--border-card)", opacity: isPast || isCancelled ? 0.6 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: "600" }}>{session.trainer_name}</h4>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                          {new Date(session.scheduled_at).toLocaleString("ro-RO", { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className={`badge ${isCancelled ? 'badge--expired' : 'badge--active'}`}>
                        {session.status}
                      </span>
                    </div>
                    
                    {!isPast && !isCancelled && (
                      <button 
                        onClick={() => handleCancelTrainerSession(session.id)}
                        className="btn btn-outline" 
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", marginTop: "0.75rem", width: "100%" }}
                      >
                        Anulează Ședința
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showEditProfileModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfileModal(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
}

function DaysRemaining({ endDate }) {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  const totalDays = 30; // approximate for progress bar
  const pct = Math.max(0, Math.min(100, (diff / totalDays) * 100));

  const color =
    diff > 14 ? "var(--success)" : diff > 5 ? "var(--warning)" : "var(--danger)";

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Zile Rămase</span>
        <span style={{ color, fontWeight: "bold" }}>
          {diff > 0 ? diff : 0}
        </span>
      </div>
      <div style={{ height: "6px", background: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
        <div
          style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 1s ease-in-out" }}
        />
      </div>
    </div>
  );
}

function EditProfileModal({ profile, onClose, onUpdate }) {
  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    photo_url: profile?.photo_url || "",
    password: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/members/profile/photo", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error("Eroare la încărcarea pozei");
      const data = await res.json();
      setForm(prev => ({ ...prev, photo_url: data.photo_url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onUpdate(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Editează Profilul</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Poza de Profil (Încarcă de pe PC)</label>
            <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} disabled={uploading} style={{ padding: "0.5rem" }} />
            {uploading && <div style={{ fontSize: "0.85rem", color: "var(--accent-light)", marginTop: "0.25rem" }}>Se încarcă fișierul...</div>}
            {form.photo_url && (
              <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <img src={form.photo_url} alt="Preview" style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--accent)" }} />
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>{form.photo_url}</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Prenume</label>
            <input className="form-input" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Nume</label>
            <input className="form-input" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Telefon (Opțional)</label>
            <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Parolă Nouă (Opțional)</label>
            <input type="password" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Lasă gol pentru a nu schimba" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn btn-accent" disabled={saving || uploading}>{saving ? "Se salvează..." : "Salvează"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MemberDashboard;
