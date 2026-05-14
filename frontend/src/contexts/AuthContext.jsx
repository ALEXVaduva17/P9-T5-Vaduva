import React from 'react';
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      fetchUser();
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

  const fetchUser = async (currentToken) => {
    const t = currentToken || token;
    if (!t) return;
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setToken(null);
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
      setToken(null);
      localStorage.removeItem("token");
    }
  };

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      await fetchUser(data.access_token);
      return { success: true };
    } else {
      return { success: false, error: data.detail };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
