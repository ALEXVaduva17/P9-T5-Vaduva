import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

function AdminDashboard() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subTypes, setSubTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showEditTrainerModal, setShowEditTrainerModal] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showEditFacilityModal, setShowEditFacilityModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState(null);
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [selectedMemberForSubEdit, setSelectedMemberForSubEdit] = useState(null);
  
  const [activeTab, setActiveTab] = useState("members");

  const fetchMembers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/members", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data.members);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSubTypes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/subscriptions/types", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch subscription types");
      const data = await res.json();
      setSubTypes(data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      setClasses(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTrainers = useCallback(async () => {
    try {
      const res = await fetch("/api/trainers");
      if (!res.ok) throw new Error("Failed to fetch trainers");
      const data = await res.json();
      setTrainers(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await fetch("/api/facilities");
      if (!res.ok) throw new Error("Failed to fetch facilities");
      const data = await res.json();
      setFacilities(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchSubTypes();
    fetchClasses();
    fetchTrainers();
    fetchFacilities();
  }, [fetchMembers, fetchSubTypes, fetchClasses, fetchTrainers, fetchFacilities]);

  const handleCreateFacility = async (formData) => {
    try {
      const res = await fetch("/api/facilities", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create facility");
      }
      setShowFacilityModal(false);
      fetchFacilities();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateFacility = async (facilityId, formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/facilities/${facilityId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update facility");
      }
      setShowEditFacilityModal(false);
      setSelectedFacility(null);
      fetchFacilities();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteFacility = async (facilityId) => {
    if (!confirm("Ești sigur că vrei să ștergi această sală?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/facilities/${facilityId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to delete facility");
      }
      fetchFacilities();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateMember = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create member");
      }
      setShowCreateModal(false);
      fetchMembers();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateMember = async (memberId, formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update member");
      }
      setShowEditMemberModal(false);
      setSelectedMemberForEdit(null);
      fetchMembers();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm("Ești sigur că vrei să ștergi acest membru și toate datele asociate?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to delete member");
      }
      fetchMembers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (member) => {
    const newStatus = member.subscription_status === "restricted" ? "active" : "restricted";
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ subscription_status: newStatus }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update status");
      }
      fetchMembers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSub = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create subscription");
      }
      setShowSubModal(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateSub = async (memberId, formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/subscriptions/member/${memberId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update subscription");
      }
      setShowEditSubModal(false);
      setSelectedMemberForSubEdit(null);
      fetchMembers();
    } catch (err) {
      throw err;
    }
  };

  const handleCancelSub = async (memberId) => {
    if (!confirm("Ești sigur că vrei să anulezi/ștergi abonamentul activ al acestui membru?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/subscriptions/member/${memberId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to cancel subscription");
      }
      fetchMembers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateClass = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create class");
      }
      setShowClassModal(false);
      fetchClasses();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateClass = async (classId, formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update class");
      }
      setShowEditClassModal(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!confirm("Ești sigur că vrei să ștergi această clasă?")) return;
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to delete class");
      }
      fetchClasses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTrainer = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/trainers", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create trainer");
      }
      setShowTrainerModal(false);
      fetchTrainers();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateTrainer = async (trainerId, formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/trainers/${trainerId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update trainer");
      }
      setShowEditTrainerModal(false);
      setSelectedTrainer(null);
      fetchTrainers();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteTrainer = async (trainerId) => {
    if (!confirm("Ești sigur că vrei să ștergi acest instructor?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/trainers/${trainerId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to delete trainer");
      }
      fetchTrainers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePlan = async (typeId, formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/subscriptions/types/${typeId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update plan");
      }
      setShowEditPlanModal(false);
      setSelectedPlan(null);
      fetchSubTypes();
    } catch (err) {
      throw err;
    }
  };

  const handleCreatePlan = async (formData) => {
    try {
      const res = await fetch("/api/subscriptions/types", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create plan");
      }
      setShowCreatePlanModal(false);
      fetchSubTypes();
    } catch (err) {
      throw err;
    }
  };

  const handleDeletePlan = async (typeId) => {
    if (!confirm("Ești sigur că vrei să ștergi acest plan de abonament?")) return;
    try {
      const res = await fetch(`/api/subscriptions/types/${typeId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to delete plan");
      }
      fetchSubTypes();
    } catch (err) {
      alert(err.message);
    }
  };

  const getBadgeClass = (status) => {
    const map = {
      active: "badge--active",
      none: "badge--none",
      expired: "badge--expired",
      restricted: "badge--restricted",
    };
    return map[status] || "badge--none";
  };

  return (
    <div>
      {/* ── Stats row ── */}
      <div className="stats-row">
        <div className="stat-card card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value stat-value--success">
            {members.filter((m) => m.subscription_status === "active").length}
          </div>
          <div className="stat-label">Active Subscriptions</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value stat-value--warning">
            {members.filter((m) => m.subscription_status === "expired").length}
          </div>
          <div className="stat-label">Expired</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value stat-value--danger">
            {members.filter((m) => m.subscription_status === "restricted").length}
          </div>
          <div className="stat-label">Restricted</div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'members' ? 'btn-accent' : 'btn-outline'}`} onClick={() => setActiveTab('members')}>👥 Members</button>
        <button className={`btn ${activeTab === 'classes' ? 'btn-accent' : 'btn-outline'}`} onClick={() => setActiveTab('classes')}>📅 Classes</button>
        <button className={`btn ${activeTab === 'trainers' ? 'btn-accent' : 'btn-outline'}`} onClick={() => setActiveTab('trainers')}>💪 Instructori</button>
        <button className={`btn ${activeTab === 'facilities' ? 'btn-accent' : 'btn-outline'}`} onClick={() => setActiveTab('facilities')}>🏢 Săli</button>
        <button className={`btn ${activeTab === 'plans' ? 'btn-accent' : 'btn-outline'}`} onClick={() => setActiveTab('plans')}>💰 Subscription Plans</button>
      </div>

      {error && <div className="error-banner" style={{ marginTop: '1rem' }}>{error}</div>}

      {/* ── Members Tab ── */}
      {activeTab === 'members' && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span>👥</span> Members</div>
            <button
              className="btn btn-accent btn--sm"
              onClick={() => setShowCreateModal(true)}
            >
              + Add Member
            </button>
          </div>

          {loading ? (
            <div className="loader">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>No members yet. Add your first member to get started.</p>
              <button
                className="btn btn-accent" style={{ marginTop: '1rem' }}
                onClick={() => setShowCreateModal(true)}
              >
                + Add Member
              </button>
            </div>
          ) : (
            <div className="table-wrap" style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table className="table" id="members-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                    <th style={{ padding: '1rem 0' }}>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                      <td style={{ color: "var(--text-muted)", padding: '1rem 0' }}>#{m.id}</td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {m.first_name} {m.last_name}
                      </td>
                      <td>{m.email}</td>
                      <td>{m.phone}</td>
                      <td>
                        <span className={`badge ${getBadgeClass(m.subscription_status)}`}>
                          {m.subscription_status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {m.subscription_status !== "active" && (
                          <button
                            className="btn btn-outline btn--sm"
                            onClick={() => {
                              setSelectedMember(m);
                              setShowSubModal(true);
                            }}
                          >
                            + Subscription
                          </button>
                        )}
                        {m.subscription_status === "active" && (
                          <>
                            <button
                              className="btn btn-outline btn--sm"
                              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                              onClick={() => {
                                setSelectedMemberForSubEdit(m);
                                setShowEditSubModal(true);
                              }}
                            >
                              Modifică Abonament
                            </button>
                            <button
                              className="btn btn-outline btn--sm"
                              style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
                              onClick={() => handleCancelSub(m.id)}
                            >
                              Scoate Abonament
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-outline btn--sm"
                          onClick={() => {
                            setSelectedMemberForEdit(m);
                            setShowEditMemberModal(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline btn--sm"
                          style={{ borderColor: m.subscription_status === 'restricted' ? 'var(--success)' : 'var(--warning)', color: m.subscription_status === 'restricted' ? 'var(--success)' : 'var(--warning)' }}
                          onClick={() => handleToggleStatus(m)}
                        >
                          {m.subscription_status === 'restricted' ? 'Activează' : 'Restricționează'}
                        </button>
                        <button
                          className="btn btn-outline btn--sm"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          onClick={() => handleDeleteMember(m.id)}
                        >
                          Șterge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Classes Tab ── */}
      {activeTab === 'classes' && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span>📅</span> Classes</div>
            <button
              className="btn btn-accent btn--sm"
              onClick={() => setShowClassModal(true)}
            >
              + Add Class
            </button>
          </div>

          <div className="schedule-grid" style={{ marginTop: '1rem' }}>
            {classes.map(c => (
              <div key={c.id} className="class-card">
                <div className="class-time">{new Date(c.scheduled_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="class-info">
                  <h3>{c.name}</h3>
                  <div className="class-meta">
                    <span>📅 {new Date(c.scheduled_at).toLocaleDateString('ro-RO')}</span>
                    <span>⏱️ {c.duration_minutes} min</span>
                  </div>
                </div>
                <div className="class-actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="capacity-badge">{c.reserved_count} / {c.capacity} Ocupat</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-outline btn--sm" 
                      onClick={() => {
                        setSelectedClass(c);
                        setShowEditClassModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-outline btn--sm" 
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => handleDeleteClass(c.id)}
                    >
                      Șterge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Subscription Types Tab ── */}
      {activeTab === 'plans' && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span>💰</span> Subscription Plans</div>
            <button
              className="btn btn-accent btn--sm"
              onClick={() => setShowCreatePlanModal(true)}
            >
              + Add Plan
            </button>
          </div>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {subTypes.map((t) => (
              <div key={t.id} className="plan-card card" style={{ padding: '1.5rem', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                <div className="plan-name" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{t.name}</div>
                <div className="plan-price" style={{ fontSize: '1.5rem', color: 'var(--accent)', margin: '0.5rem 0' }}>{parseFloat(t.base_fee).toFixed(0)} RON</div>
                <div className="plan-duration" style={{ color: 'var(--text-secondary)' }}>{t.duration_days} days</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    className="btn btn-outline" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setSelectedPlan(t);
                      setShowEditPlanModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => handleDeletePlan(t.id)}
                  >
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Trainers Tab ── */}
      {activeTab === 'trainers' && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span>💪</span> Instructori</div>
            <button
              className="btn btn-accent btn--sm"
              onClick={() => setShowTrainerModal(true)}
            >
              + Adaugă Instructor
            </button>
          </div>

          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {trainers.map((t) => (
              <div key={t.id} className="plan-card card" style={{ padding: '1.5rem', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                <div className="plan-name" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{t.name}</div>
                <div style={{ color: 'var(--accent)', margin: '0.5rem 0', fontWeight: '500' }}>{t.specialization || 'Fără specializare'}</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.bio || 'Nicio descriere adăugată.'}</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline btn--sm" style={{ flex: 1 }} onClick={() => { setSelectedTrainer(t); setShowEditTrainerModal(true); }}>Edit</button>
                  <button className="btn btn-outline btn--sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDeleteTrainer(t.id)}>Șterge</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Facilities Tab ── */}
      {activeTab === 'facilities' && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span>🏢</span> Săli / Facilități</div>
            <button
              className="btn btn-accent btn--sm"
              onClick={() => setShowFacilityModal(true)}
            >
              + Adaugă Sală
            </button>
          </div>

          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {facilities.map((f) => (
              <div key={f.id} className="plan-card card" style={{ padding: '1.5rem', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)' }}>
                <div className="plan-name" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{f.name}</div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline btn--sm" style={{ flex: 1 }} onClick={() => { setSelectedFacility(f); setShowEditFacilityModal(true); }}>Edit</button>
                  <button className="btn btn-outline btn--sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDeleteFacility(f.id)}>Șterge</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateModal && (
        <CreateMemberModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateMember}
        />
      )}

      {showEditMemberModal && selectedMemberForEdit && (
        <EditMemberModal
          member={selectedMemberForEdit}
          onClose={() => {
            setShowEditMemberModal(false);
            setSelectedMemberForEdit(null);
          }}
          onUpdate={handleUpdateMember}
        />
      )}

      {showSubModal && selectedMember && (
        <CreateSubModal
          member={selectedMember}
          subTypes={subTypes}
          onClose={() => {
            setShowSubModal(false);
            setSelectedMember(null);
          }}
          onCreate={handleCreateSub}
        />
      )}

      {showEditSubModal && selectedMemberForSubEdit && (
        <EditSubModal
          member={selectedMemberForSubEdit}
          subTypes={subTypes}
          onClose={() => {
            setShowEditSubModal(false);
            setSelectedMemberForSubEdit(null);
          }}
          onUpdate={handleUpdateSub}
        />
      )}

      {showClassModal && (
        <CreateClassModal
          trainers={trainers}
          facilities={facilities}
          onClose={() => setShowClassModal(false)}
          onCreate={handleCreateClass}
        />
      )}

      {showCreatePlanModal && (
        <CreatePlanModal
          onClose={() => setShowCreatePlanModal(false)}
          onCreate={handleCreatePlan}
        />
      )}

      {showEditPlanModal && selectedPlan && (
        <EditPlanModal
          plan={selectedPlan}
          onClose={() => {
            setShowEditPlanModal(false);
            setSelectedPlan(null);
          }}
          onUpdate={handleUpdatePlan}
        />
      )}

      {showEditClassModal && selectedClass && (
        <EditClassModal
          cls={selectedClass}
          trainers={trainers}
          facilities={facilities}
          onClose={() => {
            setShowEditClassModal(false);
            setSelectedClass(null);
          }}
          onUpdate={handleUpdateClass}
        />
      )}

      {showTrainerModal && (
        <CreateTrainerModal
          onClose={() => setShowTrainerModal(false)}
          onCreate={handleCreateTrainer}
        />
      )}

      {showEditTrainerModal && selectedTrainer && (
        <EditTrainerModal
          trainer={selectedTrainer}
          onClose={() => {
            setShowEditTrainerModal(false);
            setSelectedTrainer(null);
          }}
          onUpdate={handleUpdateTrainer}
        />
      )}

      {showFacilityModal && (
        <CreateFacilityModal
          onClose={() => setShowFacilityModal(false)}
          onCreate={handleCreateFacility}
        />
      )}

      {showEditFacilityModal && selectedFacility && (
        <EditFacilityModal
          facility={selectedFacility}
          onClose={() => {
            setShowEditFacilityModal(false);
            setSelectedFacility(null);
          }}
          onUpdate={handleUpdateFacility}
        />
      )}
    </div>
  );
}

function CreateFacilityModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onCreate({ name });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Adaugă Sală / Facilitate</div>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nume Sală</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Sala de Forță, Bazin, etc."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Se adaugă..." : "Adaugă Sală"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditFacilityModal({ facility, onClose, onUpdate }) {
  const [name, setName] = useState(facility.name);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onUpdate(facility.id, { name });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Editează Sală</div>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nume Sală</label>
            <input
              type="text"
              className="form-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Se salvează..." : "Salvează Modificările"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateMemberModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onCreate(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Add New Member</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="inp-first-name">First Name</label>
            <input id="inp-first-name" className="form-input" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="inp-last-name">Last Name</label>
            <input id="inp-last-name" className="form-input" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="inp-phone">Phone</label>
            <input id="inp-phone" className="form-input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="inp-email">Email</label>
            <input id="inp-email" className="form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Creating..." : "Create Member"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateSubModal({ member, subTypes, onClose, onCreate }) {
  const [typeId, setTypeId] = useState(subTypes[0]?.id || "");
  const [ptSessions, setPtSessions] = useState(0);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedType = subTypes.find((t) => t.id === Number(typeId));
  const baseFee = selectedType ? parseFloat(selectedType.base_fee) : 0;
  const totalAmount = baseFee + ptSessions * 50;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        member_id: member.id,
        type_id: Number(typeId),
        pt_sessions: ptSessions,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">New Subscription for {member.first_name}</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subscription Plan</label>
            <select className="form-input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {subTypes.filter((t) => t.is_active).map((t) => (
                <option key={t.id} value={t.id}>{t.name} — {parseFloat(t.base_fee).toFixed(0)} RON</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>PT Sessions (50 RON each)</label>
            <input className="form-input" type="number" min="0" value={ptSessions} onChange={(e) => setPtSessions(Math.max(0, Number(e.target.value)))} />
          </div>
          <div className="price-preview">
            <div className="price-row"><span>Base fee</span><span>{baseFee.toFixed(2)} RON</span></div>
            <div className="price-row"><span>PT sessions</span><span>{(ptSessions * 50).toFixed(2)} RON</span></div>
            <div className="price-row price-row--total"><span>Total</span><span>{totalAmount.toFixed(2)} RON</span></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditSubModal({ member, subTypes, onClose, onUpdate }) {
  const [typeId, setTypeId] = useState("");
  const [ptSessions, setPtSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSub() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/subscriptions/member/${member.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch active subscription");
        const data = await res.json();
        setTypeId(data.type_id);
        setPtSessions(data.pt_sessions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSub();
  }, [member.id]);

  const selectedType = subTypes.find((t) => t.id === Number(typeId));
  const baseFee = selectedType ? parseFloat(selectedType.base_fee) : 0;
  const totalAmount = baseFee + ptSessions * 50;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onUpdate(member.id, {
        type_id: Number(typeId),
        pt_sessions: ptSessions,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Modifică Abonament: {member.first_name}</div>
        {error && <div className="error-banner">{error}</div>}
        {loading ? (
          <div className="loader" style={{ margin: "2rem 0" }}>Se încarcă detaliile...</div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Subscription Plan</label>
              <select className="form-input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                {subTypes.filter((t) => t.is_active).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {parseFloat(t.base_fee).toFixed(0)} RON</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>PT Sessions (50 RON each)</label>
              <input className="form-input" type="number" min="0" value={ptSessions} onChange={(e) => setPtSessions(Math.max(0, Number(e.target.value)))} />
            </div>
            <div className="price-preview">
              <div className="price-row"><span>Base fee</span><span>{baseFee.toFixed(2)} RON</span></div>
              <div className="price-row"><span>PT sessions</span><span>{(ptSessions * 50).toFixed(2)} RON</span></div>
              <div className="price-row price-row--total"><span>Total</span><span>{totalAmount.toFixed(2)} RON</span></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>Anulează</button>
              <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Se salvează..." : "Salvează Modificările"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CreateClassModal({ trainers, facilities, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    capacity: 20,
    scheduled_at: "",
    duration_minutes: 60,
    description: "",
    trainer_id: trainers[0]?.id || "",
    facility_id: facilities[0]?.id || ""
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const scheduled_at = new Date(form.scheduled_at).toISOString();
      const trainer_id = form.trainer_id ? Number(form.trainer_id) : null;
      const facility_id = form.facility_id ? Number(form.facility_id) : null;
      await onCreate({ ...form, scheduled_at, trainer_id, facility_id });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Add New Class</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Class Name</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Instructor</label>
            <select className="form-input" value={form.trainer_id} onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}>
              <option value="">Fără instructor</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Sală / Facilitate</label>
            <select className="form-input" value={form.facility_id} onChange={(e) => setForm({ ...form, facility_id: e.target.value })}>
              <option value="">Fără sală</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input className="form-input" type="number" min="1" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Scheduled At</label>
            <input className="form-input" type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input className="form-input" type="number" min="15" required value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Creating..." : "Create Class"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPlanModal({ plan, onClose, onUpdate }) {
  const [form, setForm] = useState({
    name: plan.name,
    base_fee: plan.base_fee,
    duration_days: plan.duration_days,
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onUpdate(plan.id, form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Edit Plan: {plan.name}</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Plan Name</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Base Fee (RON)</label>
            <input className="form-input" type="number" step="0.01" required value={form.base_fee} onChange={(e) => setForm({ ...form, base_fee: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Duration (days)</label>
            <input className="form-input" type="number" min="1" required value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreatePlanModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    base_fee: 100,
    duration_days: 30,
    description: ""
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onCreate(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Add New Subscription Plan</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Plan Name</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Base Fee (RON)</label>
            <input className="form-input" type="number" step="0.01" required value={form.base_fee} onChange={(e) => setForm({ ...form, base_fee: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Duration (days)</label>
            <input className="form-input" type="number" min="1" required value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Creating..." : "Create Plan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminDashboard;

function EditClassModal({ cls, trainers, facilities, onClose, onUpdate }) {
  // Find trainer by matching trainer_name to ID, or if cls.trainer_id exists
  const initialTrainerId = cls.trainer_id || (trainers.find(t => t.name === cls.trainer_name)?.id || "");
  const initialFacilityId = cls.facility_id || (facilities.find(f => f.name === cls.facility_name)?.id || "");

  const [form, setForm] = useState({
    name: cls.name,
    capacity: cls.capacity,
    scheduled_at: cls.scheduled_at ? new Date(cls.scheduled_at).toISOString().slice(0, 16) : "",
    duration_minutes: cls.duration_minutes,
    description: cls.description || "",
    trainer_id: initialTrainerId,
    facility_id: initialFacilityId
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const scheduled_at = new Date(form.scheduled_at).toISOString();
      const trainer_id = form.trainer_id ? Number(form.trainer_id) : null;
      const facility_id = form.facility_id ? Number(form.facility_id) : null;
      await onUpdate(cls.id, { ...form, scheduled_at, trainer_id, facility_id });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Edit Class: {cls.name}</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Class Name</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Instructor</label>
            <select className="form-input" value={form.trainer_id} onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}>
              <option value="">Fără instructor</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Sală / Facilitate</label>
            <select className="form-input" value={form.facility_id} onChange={(e) => setForm({ ...form, facility_id: e.target.value })}>
              <option value="">Fără sală</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input className="form-input" type="number" min="1" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Scheduled At</label>
            <input className="form-input" type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input className="form-input" type="number" min="15" required value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateTrainerModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    bio: "",
    photo_url: ""
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onCreate(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Adaugă Instructor Nou</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nume Instructor</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Specializare</label>
            <input className="form-input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="ex: Yoga, Fitness, Pilates" />
          </div>
          <div className="form-group">
            <label>Scurtă descriere (Bio)</label>
            <textarea className="form-input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Câteva cuvinte despre experiență..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Se salvează..." : "Adaugă Instructor"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTrainerModal({ trainer, onClose, onUpdate }) {
  const [form, setForm] = useState({
    name: trainer.name,
    specialization: trainer.specialization || "",
    bio: trainer.bio || "",
    photo_url: trainer.photo_url || ""
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onUpdate(trainer.id, form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Editează Instructor: {trainer.name}</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nume Instructor</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Specializare</label>
            <input className="form-input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="ex: Yoga, Fitness, Pilates" />
          </div>
          <div className="form-group">
            <label>Scurtă descriere (Bio)</label>
            <textarea className="form-input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Câteva cuvinte despre experiență..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Se salvează..." : "Salvează Modificările"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditMemberModal({ member, onClose, onUpdate }) {
  const [form, setForm] = useState({
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onUpdate(member.id, form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Editează Membru: {member.first_name} {member.last_name}</div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Prenume</label>
            <input className="form-input" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Nume</label>
            <input className="form-input" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Telefon</label>
            <input className="form-input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Se salvează..." : "Salvează Modificările"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
