// PackCheck AI: Gateway and Core Backend Entrypoint
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import { validateStartupEnv } from "./config/envValidation.js";
import authRoutes from "./routes/auth.js";
import inspectionRoutes from "./routes/inspections.js";
import dashboardRoutes from "./routes/dashboard.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { securityHeadersMiddleware } from "./middleware/securityHeaders.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkAIHealth } from "./services/aiClient.js";

dotenv.config();
validateStartupEnv();
const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Environment-aware CORS configuration
const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? [process.env.FRONTEND_ORIGIN]
  : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman, same-origin)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy rejection for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Security & Correlation Middlewares
app.use(requestIdMiddleware);
app.use(securityHeadersMiddleware);
app.use(generalLimiter);

// Static uploads serving with security headers
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'self' data: blob:; img-src 'self' data: blob: http: https:;");
    next();
  },
  express.static(path.resolve(uploadDir))
);

// Primary Canonical API v1 Routes
app.use("/api/v1", inspectionRoutes);

// Legacy and convenience routes (Backward Compatibility)
app.use("/api/auth", authRoutes);
app.use("/api/scans", inspectionRoutes); // Map /api/scans to canonical router
app.use("/api/dashboard", dashboardRoutes);
app.use("/scan", inspectionRoutes); // Handle frontend direct /scan paths

// Liveness probe
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "packcheck-backend-gateway",
    version: "2.1.0",
    requestId: req.requestId,
  })
);

// Comprehensive Readiness Probe
app.get("/ready", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "UP" : "DEGRADED_MEMORY_MODE";
  const aiHealthy = await checkAIHealth();
  const storageWritable = fs.existsSync(uploadDir);

  const isReady = storageWritable && (dbStatus === "UP" || process.env.NODE_ENV !== "production");

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "READY" : "NOT_READY",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    components: {
      database: dbStatus,
      aiService: aiHealthy ? "UP" : "DOWN",
      storage: storageWritable ? "UP" : "DOWN",
    },
  });
});

// Centralized error handler
app.use(errorHandler);

const isTestEnv =
  process.env.NODE_ENV === "test" ||
  process.argv.some((arg) => arg.includes("test"));

let server;

if (!isTestEnv) {
  connectDB().then(() => {
    server = app.listen(PORT, () => console.log(`PackCheck Backend Gateway running on port ${PORT}`));
  });

  // Graceful shutdown listener
  const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
      server.close(async () => {
        console.log("HTTP server closed.");
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          console.log("MongoDB connection closed.");
        }
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

export { app };
export default app;
