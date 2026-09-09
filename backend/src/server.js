// PackCheck AI: Gateway and Core Backend Entrypoint
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import inspectionRoutes from "./routes/inspections.js";
import scanRoutes from "./routes/scans.js";
import dashboardRoutes from "./routes/dashboard.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
const app = express();

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Middlewares
app.use(cors({ origin: "*" })); // Allow local dev origins (3000, 5173, etc.)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(requestIdMiddleware);

// Static uploads serving
app.use("/uploads", express.static(path.resolve(uploadDir)));

// Primary Canonical API v1 Routes
app.use("/api/v1", inspectionRoutes);

// Legacy and convenience routes (Backward Compatibility)
app.use("/api/auth", authRoutes);
app.use("/api/scans", inspectionRoutes); // Map /api/scans to canonical router
app.use("/api/dashboard", dashboardRoutes);
app.use("/scan", inspectionRoutes); // Handle frontend direct /scan paths

// Liveness & health probe
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "packcheck-backend-gateway",
    version: "2.1.0",
    requestId: req.requestId,
  })
);

// Centralized error handler
app.use(errorHandler);

const isTestEnv =
  process.env.NODE_ENV === "test" ||
  process.argv.some((arg) => arg.includes("test"));

if (!isTestEnv) {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`PackCheck Backend Gateway running on port ${PORT}`));
  });
}

export { app };
export default app;

