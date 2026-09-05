import { Routes, Route } from "react-router-dom";
import Upload from "./pages/Upload.jsx";
import Result from "./pages/Result.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Upload />} />
      <Route path="/scan/:id" element={<Result />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
