import express from "express";
import cors from "cors";
import "dotenv/config";

import { config } from "./config/env.js";

import voiceRoutes from "./routes/voice.routes.js";
import ttsRoutes from "./routes/tts.routes.js";

const app = express();

// ==========================
// 🔧 MIDDLEWARE
// ==========================
app.use(cors({ origin: config.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "50mb" }));

// ==========================
// 📡 ROUTES
// ==========================
app.use("/api/voice", voiceRoutes);
app.use("/api/tts", ttsRoutes);

// ==========================
// 🔍 HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  res.send("ARGUS API running");
});

// ==========================
// 🚀 START
// ==========================
app.listen(config.PORT, () => {
  console.log(`🚀 ARGUS running on port ${config.PORT}`);
});