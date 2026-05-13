import { useState } from "react";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import MemberDashboard from "./pages/MemberDashboard.jsx";
import "./App.css";

function App() {
  const [view, setView] = useState("admin");

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
          </nav>
        </header>

        {/* ── Main content ── */}
        <main className="app-main">
          {view === "admin" ? <AdminDashboard /> : <MemberDashboard />}
        </main>
      </div>
    </div>
  );
}

export default App;
