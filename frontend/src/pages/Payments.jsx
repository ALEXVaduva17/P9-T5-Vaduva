import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(100);
  const { user } = useAuth();

  useEffect(() => {
    fetchHistory();
    if (user?.role === "admin") {
      fetchAllPayments();
    }
  }, [user]);

  const fetchHistory = () => {
    fetch("/api/payments/history")
      .then(res => res.json())
      .then(data => {
        setPayments(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  const fetchAllPayments = () => {
    fetch("/api/payments/all")
      .then(res => res.json())
      .then(data => setAllPayments(data))
      .catch(err => console.error(err));
  };

  const handleInitiate = async () => {
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: 1, amount: paymentAmount, currency: "RON" })
      });
      const data = await res.json();
      alert(`Payment Initiated. Gateway Session ID: ${data.gateway_session_id}`);
      
      // Simulare Webhook (Success)
      setTimeout(async () => {
        const whRes = await fetch("/api/payments/webhook_mock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: data.gateway_session_id, is_success: true })
        });
        const whData = await whRes.json();
        alert(`Webhook Response: ${whData.message} (Status: ${whData.payment_status})`);
        
        fetchHistory();
        if (user?.role === "admin") fetchAllPayments();
      }, 2000);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="payments-container" style={{ padding: "20px", maxWidth: "800px", margin: "auto", background: "#111", color: "#fff", borderRadius: "8px", marginTop: "20px" }}>
      <h2 style={{ color: "#00E676" }}>Plăți Online</h2>
      
      <div style={{ background: "#222", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>Simulare Plată</h3>
        <input 
          type="number" 
          value={paymentAmount} 
          onChange={(e) => setPaymentAmount(e.target.value)} 
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #444", marginRight: "10px", background: "#333", color: "#fff" }}
        />
        <button 
          onClick={handleInitiate}
          style={{ padding: "10px 20px", background: "#00E676", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          Plătește (Mock)
        </button>
      </div>

      <div style={{ background: "#222", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3>Istoricul Meu (Membru)</h3>
        {loading ? <p>Loading...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ background: "#333" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>ID</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Sumă</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #444" }}>
                  <td style={{ padding: "10px" }}>{p.id}</td>
                  <td style={{ padding: "10px" }}>{p.amount} {p.currency}</td>
                  <td style={{ padding: "10px", color: p.status === 'completed' ? '#00E676' : '#FF5252' }}>{p.status}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan="3" style={{ padding: "10px", textAlign: "center" }}>Nu există plăți.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {user?.role === "admin" && (
        <div style={{ background: "#222", padding: "20px", borderRadius: "8px" }}>
          <h3>Toate Plățile (Admin View)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ background: "#333" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>ID Plată</th>
                <th style={{ padding: "10px", textAlign: "left" }}>ID Abonament</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Sumă</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #444" }}>
                  <td style={{ padding: "10px" }}>{p.id}</td>
                  <td style={{ padding: "10px" }}>{p.subscription_id}</td>
                  <td style={{ padding: "10px" }}>{p.amount} {p.currency}</td>
                  <td style={{ padding: "10px", color: p.status === 'completed' ? '#00E676' : '#FF5252' }}>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
