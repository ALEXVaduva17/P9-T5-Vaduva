import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import MemberDashboard from "./pages/MemberDashboard.jsx";
import Payments from "./pages/Payments";
import "./App.css";

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [view, setView] = useState("admin");

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app">
      {/* ── Ambient glow ── */}
      <div className="hero-glow" />
      <div className="hero-glow hero-glow--secondary" />

      {/* ── Layout ── */}
      <div className="app-layout">
        {/* ── Header ── */}
        <header className="app-header">
          <div className="header-brand">
            <div className="brand-icon">F</div>
            <div>
              <h1 className="brand-title">Fitness Center</h1>
              <p className="brand-subtitle">Management System</p>
            </div>
          </div>

          <nav className="header-nav">
            <button
              id="nav-admin"
              className={`nav-btn ${view === "admin" ? "nav-btn--active" : ""}`}
              onClick={() => setView("admin")}
            >
              <span className="nav-icon">&#9881;</span>
              Admin Dashboard
            </button>
            <button
              id="nav-member"
              className={`nav-btn ${view === "member" ? "nav-btn--active" : ""}`}
              onClick={() => setView("member")}
            >
              <span className="nav-icon">&#9733;</span>
              Member View
            </button>
            <button
              id="nav-payments"
              className={`nav-btn ${view === "payments" ? "nav-btn--active" : ""}`}
              onClick={() => setView("payments")}
            >
              <span className="nav-icon">&#128176;</span>
              Payments
            </button>
            <button
              id="nav-logout"
              className="nav-btn"
              onClick={logout}
            >
              Logout
            </button>
          </nav>
        </header>

        {/* ── Main content ── */}
        <main className="app-main">
          {view === "admin" ? <AdminDashboard /> : view === "member" ? <MemberDashboard /> : <Payments />}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
