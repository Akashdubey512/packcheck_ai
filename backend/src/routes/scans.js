import express from "express";
const router = express.Router();

// POST /api/scans - upload image, call AI service, save result (see api-contract.md)
router.post("/", async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// GET /api/scans - list, paginated
router.get("/", async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// GET /api/scans/:id
router.get("/:id", async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// GET /api/scans/:id/report - PDF download
router.get("/:id/report", async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
