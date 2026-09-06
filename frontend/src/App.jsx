import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import Upload from "./pages/Upload.jsx";
import Result from "./pages/Result.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/scan/:id" element={<Result />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}
