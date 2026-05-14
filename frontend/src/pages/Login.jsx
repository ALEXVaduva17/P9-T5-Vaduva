import React from 'react';
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user, logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (isRegistering) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, phone, first_name: firstName, last_name: lastName })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Registration failed");
        }
        // If registration is successful, log them in automatically
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      }
    } else {
      // Login mode
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error);
      }
    }
    
    setIsLoading(false);
  };

  if (isAuthenticated) {
    return (
      <div className="login-container section-container">
        <div className="card" style={{ maxWidth: "400px", margin: "4rem auto", textAlign: "center" }}>
          <h2 style={{ marginBottom: "1rem" }}>Bine ai revenit, {user?.email}</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Rol activ: <strong>{user?.role}</strong></p>
          <button className="btn btn-secondary" onClick={logout} style={{ width: "100%" }}>Deconectare</button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container" style={{ padding: "4rem 2rem", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          {isRegistering ? "Creează Cont" : "Autentificare"}
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9rem" }}>
          {isRegistering ? "Alătură-te celei mai mari comunități de fitness." : "Intră în contul tău pentru a rezerva clase și gestiona abonamentul."}
        </p>
        
        {error && (
          <div style={{ color: "var(--danger)", background: "var(--danger-bg)", padding: "0.75rem", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.9rem", textAlign: "center", border: "1px solid var(--danger)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isRegistering && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="firstName" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Prenume</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{ padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-card)", background: "rgba(0,0,0,0.2)", color: "white", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="lastName" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Nume</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={{ padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-card)", background: "rgba(0,0,0,0.2)", color: "white", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label htmlFor="phone" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Număr de Telefon</label>
                <input
                  type="text"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{ padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-card)", background: "rgba(0,0,0,0.2)", color: "white", outline: "none" }}
                />
              </div>
            </>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label htmlFor="email" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Adresă de Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-card)", background: "rgba(0,0,0,0.2)", color: "white", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label htmlFor="password" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Parolă</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-card)", background: "rgba(0,0,0,0.2)", color: "white", outline: "none" }}
            />
          </div>

          {isRegistering && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="confirmPassword" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Confirmă Parola</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-card)", background: "rgba(0,0,0,0.2)", color: "white", outline: "none" }}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
            style={{ marginTop: "1rem", width: "100%" }}
          >
            {isLoading ? "Vă rugăm așteptați..." : (isRegistering ? "Creează Cont" : "Sign In")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {isRegistering ? "Ai deja un cont?" : "Nu ai un cont încă?"}{" "}
          <span 
            onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
            style={{ color: "var(--accent-light)", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
          >
            {isRegistering ? "Autentifică-te aici" : "Înregistrează-te"}
          </span>
        </div>
      </div>
    </div>
  );
}
