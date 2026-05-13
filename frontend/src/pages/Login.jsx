import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user, logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  if (isAuthenticated) {
    return (
      <div className="login-container">
        <div className="status-card">
          <h2>Welcome, {user?.email}</h2>
          <p>Role: {user?.role}</p>
          <button onClick={logout} style={{ marginTop: "1rem" }}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="status-card" style={{ width: "350px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Login</h2>
        
        {error && (
          <div style={{ color: "var(--error)", marginBottom: "1rem", fontSize: "0.9rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label htmlFor="email" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-card)", background: "rgba(0,0,0,0.2)", color: "white" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label htmlFor="password" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-card)", background: "rgba(0,0,0,0.2)", color: "white" }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              marginTop: "1rem", 
              padding: "0.75rem", 
              borderRadius: "8px", 
              background: "var(--accent)", 
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
