import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import Upload from "./pages/Upload.jsx";
import Result from "./pages/Result.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

const AUTH_PATHS = ["/login", "/register"];

export default function App() {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/scan/:id" element={<Result />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </AppShell>
  );
}
