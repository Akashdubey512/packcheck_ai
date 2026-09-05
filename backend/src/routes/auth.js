import express from "express";
const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

export default router;
