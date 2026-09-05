// Akash & Ravi: app entrypoint
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import scanRoutes from "./routes/scans.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.use(express.json());
app.use("/uploads", express.static(process.env.UPLOAD_DIR || "./uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
});
