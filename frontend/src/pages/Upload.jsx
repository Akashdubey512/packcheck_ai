import { useState } from "react";
import { uploadScan } from "../api/scans.js";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const result = await uploadScan(file);
      // TODO: navigate to /scan/:id with result
      console.log(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit" disabled={loading}>
        {loading ? "Analyzing..." : "Scan Label"}
      </button>
    </form>
  );
}
