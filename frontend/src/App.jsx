import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import "./App.css";

function Dashboard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Backend unreachable:", err);
        setHealth({ status: "error", message: err.message });
        setLoading(false);
      });
  }, []);

  return (
    <div className="hero">
      <div className="hero-glow" />
      <h1 className="hero-title">
        <span className="accent">Fitness</span> Center
      </h1>
      <p className="hero-subtitle">Management System</p>

      {user && (
        <div style={{ marginTop: "1rem" }}>
          Welcome back, {user.email}
        </div>
      )}

      <div className="status-card">
        <div className="status-header">
          <span className="status-dot" data-status={health?.status ?? "loading"} />
          <span className="status-label">Backend Status</span>
        </div>
        <p className="status-value">
          {loading
            ? "Connecting…"
            : health?.status === "ok"
            ? "✓ Operational"
            : `✗ ${health?.message || "Unavailable"}`}
        </p>
      </div>

      <p className="version">v0.1.0 — Phase 1: Authentication</p>
    </div>
  );
}

function MainApp() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app">
      {isAuthenticated ? <Dashboard /> : <Login />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
