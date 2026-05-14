import React, { useState } from 'react';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import SchedulePage from "./pages/SchedulePage";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import MemberDashboard from "./pages/MemberDashboard";
import TrainersPage from "./pages/TrainersPage";
import "./App.css";

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [view, setView] = useState("home"); // home, subscriptions, schedule, trainers, login, dashboard

  // Navigate to appropriate dashboard if clicking "dashboard"
  const renderView = () => {
    switch (view) {
      case "home":
        return <LandingPage setView={setView} />;
      case "subscriptions":
        return <SubscriptionsPage setView={setView} />;
      case "schedule":
        return <SchedulePage setView={setView} />;
      case "trainers":
        return <TrainersPage setView={setView} />;
      case "login":
        if (isAuthenticated) {
           setView("dashboard");
           return null;
        }
        return <Login />;
      case "dashboard":
        if (!isAuthenticated) {
          setView("login");
          return null;
        }
        return user?.role === "admin" ? <AdminDashboard /> : <MemberDashboard />;
      default:
        return <LandingPage setView={setView} />;
    }
  };

  return (
    <div className="app">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand" style={{cursor: 'pointer'}} onClick={() => setView('home')}>
            <div style={{ width: '32px', height: '32px', background: 'var(--gradient-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>F</div>
            <span>Fitness<span className="brand-accent">Center</span></span>
          </div>

          <div className="nav-links">
            <a className={`nav-link ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>Acasă</a>
            <a className={`nav-link ${view === 'subscriptions' ? 'active' : ''}`} onClick={() => setView('subscriptions')}>Abonamente</a>
            <a className={`nav-link ${view === 'schedule' ? 'active' : ''}`} onClick={() => setView('schedule')}>Program</a>
            <a className={`nav-link ${view === 'trainers' ? 'active' : ''}`} onClick={() => setView('trainers')}>Instructori</a>
            {isAuthenticated && (
              <a className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>Dashboard</a>
            )}
          </div>

          <div className="nav-actions">
            {!isAuthenticated ? (
              <button className="btn btn-primary" onClick={() => setView('login')}>
                Contul Meu
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => { logout(); setView('home'); }}>
                Deconectare
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="main-content">
        {renderView()}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h2>Fitness Center</h2>
            <p>Transformăm vieți prin mișcare. Cel mai modern centru de fitness din orașul tău, echipat complet pentru succesul tău.</p>
          </div>
          <div className="footer-links">
            <h3>Legături Rapide</h3>
            <ul>
              <li><a onClick={() => setView('home')} style={{cursor: 'pointer'}}>Acasă</a></li>
              <li><a onClick={() => setView('subscriptions')} style={{cursor: 'pointer'}}>Abonamente</a></li>
              <li><a onClick={() => setView('schedule')} style={{cursor: 'pointer'}}>Program Clase</a></li>
              <li><a onClick={() => setView('trainers')} style={{cursor: 'pointer'}}>Echipa Instructori</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h3>Contact</h3>
            <ul>
              <li>📞 0722 123 456</li>
              <li>📧 contact@fitness.com</li>
              <li>📍 Str. Sportului Nr. 10</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Fitness Center Management System. Toate drepturile rezervate.
        </div>
      </footer>
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
