import express from "express";
import { upload } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createScan,
  listScans,
  getScanById,
  getScanReport,
} from "../controllers/scanController.js";

const router = express.Router();

// requireAuth first (must be logged in), then upload.single("image") parses the multipart body
router.post("/", requireAuth, upload.single("image"), createScan);
router.get("/", requireAuth, listScans);
router.get("/:id", requireAuth, getScanById);
router.get("/:id/report", requireAuth, getScanReport);

export default router;
