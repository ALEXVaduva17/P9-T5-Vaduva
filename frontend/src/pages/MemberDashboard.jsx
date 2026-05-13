import { useState, useEffect } from "react";

function MemberDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await fetch("/api/subscriptions/me");
        if (!res.ok) throw new Error("Failed to fetch subscription");
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, []);

  if (loading) return <div className="loader">Loading your subscription...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  const sub = data?.subscription;
  const statusClass = {
    active: "badge--active",
    none: "badge--none",
    expired: "badge--expired",
    restricted: "badge--restricted",
  }[data?.subscription_status] || "badge--none";

  return (
    <div className="member-dashboard">
      {/* ── Welcome card ── */}
      <div className="card member-welcome-card">
        <div className="member-welcome">
          <div className="member-avatar">
            {data?.member_name?.charAt(0) || "?"}
          </div>
          <div>
            <h2 className="member-name">{data?.member_name || "Unknown"}</h2>
            <span className={`badge ${statusClass}`}>
              {data?.subscription_status || "none"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Subscription card ── */}
      {sub ? (
        <div className="card sub-card">
          <div className="card-title">
            <span>&#11088;</span> Active Subscription
          </div>

          <div className="sub-details-grid">
            <div className="sub-detail">
              <div className="sub-detail-label">Plan Type</div>
              <div className="sub-detail-value">{sub.type}</div>
            </div>
            <div className="sub-detail">
              <div className="sub-detail-label">Base Fee</div>
              <div className="sub-detail-value">{parseFloat(sub.base_fee).toFixed(2)} RON</div>
            </div>
            <div className="sub-detail">
              <div className="sub-detail-label">PT Sessions</div>
              <div className="sub-detail-value">{sub.pt_sessions}</div>
            </div>
            <div className="sub-detail">
              <div className="sub-detail-label">Total Amount</div>
              <div className="sub-detail-value sub-detail-value--accent">
                {parseFloat(sub.total_amount).toFixed(2)} RON
              </div>
            </div>
            <div className="sub-detail">
              <div className="sub-detail-label">Start Date</div>
              <div className="sub-detail-value">{sub.start_date}</div>
            </div>
            <div className="sub-detail">
              <div className="sub-detail-label">End Date</div>
              <div className="sub-detail-value">{sub.end_date}</div>
            </div>
          </div>

          {/* ── Days remaining ── */}
          <DaysRemaining endDate={sub.end_date} />
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#128170;</div>
            <p>You don't have an active subscription yet.</p>
            <p style={{ fontSize: 13 }}>
              Contact an administrator to set up your membership.
            </p>
          </div>
        </div>
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
    <div className="days-remaining">
      <div className="days-remaining-header">
        <span className="days-remaining-label">Days Remaining</span>
        <span className="days-remaining-count" style={{ color }}>
          {diff > 0 ? diff : 0}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default MemberDashboard;
