import express from "express";
const router = express.Router();

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
