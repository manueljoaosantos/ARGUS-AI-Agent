import express from "express";
import cors from "cors";
import voiceRoute from "./api/voice.js";
import { config } from "./config/env.js";
import "dotenv/config";

const app = express();

// 🔥 isto já trata preflight automaticamente
app.use(cors({
    origin: "*"

}));

app.use(express.json({ limit: "15mb" }));

app.use("/api", voiceRoute);

app.get("/", (req, res) => {
  res.send("ARGUS API running");
});

app.listen(config.PORT, () => {
  console.log(`🚀 ARGUS running on port ${config.PORT}`);
});