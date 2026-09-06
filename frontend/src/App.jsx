import React from "react";
import { Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import Upload from "./pages/Upload.jsx";
import Result from "./pages/Result.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
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
