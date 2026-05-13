import { useState, useEffect, useCallback } from "react";

function AdminDashboard() {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [subTypes, setSubTypes] = useState([]);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data.members);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/subscriptions/types");
      if (!res.ok) throw new Error("Failed to fetch subscription types");
      const data = await res.json();
      setSubTypes(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchSubTypes();
  }, [fetchMembers, fetchSubTypes]);

  const handleCreateMember = async (formData) => {
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleCreateSub = async (formData) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      {/* ── Members table card ── */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">
          <span>&#128101;</span> Members
          <div style={{ marginLeft: "auto" }}>
            <button
              id="btn-add-member"
              className="btn btn--primary btn--sm"
              onClick={() => setShowCreateModal(true)}
            >
              + Add Member
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loader">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <p>No members yet. Add your first member to get started.</p>
            <button
              className="btn btn--primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Add Member
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table" id="members-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td style={{ color: "var(--text-muted)" }}>#{m.id}</td>
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
                    <td>
                      {m.subscription_status !== "active" && (
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => {
                            setSelectedMember(m);
                            setShowSubModal(true);
                          }}
                        >
                          + Subscription
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Subscription Types card ── */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">
          <span>&#128176;</span> Subscription Plans
        </div>
        <div className="plans-grid">
          {subTypes.map((t) => (
            <div key={t.id} className="plan-card">
              <div className="plan-name">{t.name}</div>
              <div className="plan-price">{parseFloat(t.base_fee).toFixed(0)} RON</div>
              <div className="plan-duration">{t.duration_days} days</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create Member Modal ── */}
      {showCreateModal && (
        <CreateMemberModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateMember}
        />
      )}

      {/* ── Create Subscription Modal ── */}
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
    </div>
  );
}

/* ── Create Member Modal ── */
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
            <input
              id="inp-first-name"
              className="form-input"
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="inp-last-name">Last Name</label>
            <input
              id="inp-last-name"
              className="form-input"
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="inp-phone">Phone</label>
            <input
              id="inp-phone"
              className="form-input"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="inp-email">Email</label>
            <input
              id="inp-email"
              className="form-input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Creating..." : "Create Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Create Subscription Modal ── */
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
        <div className="modal-title">
          New Subscription for {member.first_name} {member.last_name}
        </div>
        {error && <div className="error-banner">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="inp-sub-type">Subscription Plan</label>
            <select
              id="inp-sub-type"
              className="form-input"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              {subTypes
                .filter((t) => t.is_active)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {parseFloat(t.base_fee).toFixed(0)} RON / {t.duration_days} days
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="inp-pt-sessions">PT Sessions</label>
            <input
              id="inp-pt-sessions"
              className="form-input"
              type="number"
              min="0"
              value={ptSessions}
              onChange={(e) => setPtSessions(Math.max(0, Number(e.target.value)))}
            />
            <small style={{ color: "var(--text-muted)", fontSize: 12 }}>
              Each session costs 50 RON (REQ-8)
            </small>
          </div>

          {/* ── Price preview ── */}
          <div className="price-preview">
            <div className="price-row">
              <span>Base fee</span>
              <span>{baseFee.toFixed(2)} RON</span>
            </div>
            <div className="price-row">
              <span>PT sessions ({ptSessions} x 50)</span>
              <span>{(ptSessions * 50).toFixed(2)} RON</span>
            </div>
            <div className="price-row price-row--total">
              <span>Total</span>
              <span>{totalAmount.toFixed(2)} RON</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Creating..." : "Create Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminDashboard;
