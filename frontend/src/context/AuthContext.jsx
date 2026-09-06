import React, { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("nirikshan_token") || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("nirikshan_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Restore token and user from localStorage on refresh
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("nirikshan_token");
      const storedUser = localStorage.getItem("nirikshan_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem("nirikshan_token");
      localStorage.removeItem("nirikshan_user");
      setToken(null);
      setUser(null);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      if (data?.token && data?.user) {
        localStorage.setItem("nirikshan_token", data.token);
        localStorage.setItem("nirikshan_user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await apiRegister(name, email, password);
      if (data?.token && data?.user) {
        localStorage.setItem("nirikshan_token", data.token);
        localStorage.setItem("nirikshan_user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("nirikshan_token");
      localStorage.removeItem("nirikshan_user");
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
