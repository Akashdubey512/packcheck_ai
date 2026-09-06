import api from "./client.js";

// Matches POST /api/scans in docs/api-contract.md
export async function uploadScan(file, panelWidthCm, panelHeightCm) {
  const form = new FormData();
  form.append("image", file);
  if (panelWidthCm) form.append("panelWidthCm", panelWidthCm);
  if (panelHeightCm) form.append("panelHeightCm", panelHeightCm);

  const { data } = await api.post("/scans", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getScan(id) {
  const { data } = await api.get(`/scans/${id}`);
  return data;
}

export async function listScans(params = {}) {
  const { data } = await api.get("/scans", { params });
  return data;
}

export async function getDashboardStats() {
  const { data } = await api.get("/dashboard/stats");
  return data;
}

// Matches GET /api/scans/:id/report in docs/api-contract.md
export async function downloadScanReport(id) {
  const { data } = await api.get(`/scans/${id}/report`, {
    responseType: "blob",
  });
  return data;
}
