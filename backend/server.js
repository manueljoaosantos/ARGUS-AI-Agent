import express from "express";
import cors from "cors";
import { textToSpeech } from "./services/tts.js"; // 🔥 ESTA LINHA
import voiceRoute from "./api/voice.js";
import { config } from "./config/env.js";
import "dotenv/config";
import fs from "fs";
import path from "path";

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

let requestCount = 0;

app.get("/api/debug-audio", (req, res) => {
  console.log("🔥 DEBUG AUDIO HIT");

  const filePath = path.resolve("./debug_audio.mp3");

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Ficheiro não encontrado" });
  }

  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    "Content-Type": "audio/mpeg",
    "Content-Length": stat.size,
    "Connection": "close",
    "Cache-Control": "no-cache"
  });

  const stream = fs.createReadStream(filePath, { highWaterMark: 1024 });

  let isFirstChunk = true;

  stream.on("data", (chunk) => {
    if (isFirstChunk) {
      // 🔥 PRIMEIRO CHUNK IMEDIATO (CRÍTICO)
      res.write(chunk);
      isFirstChunk = false;
      return;
    }

    // 🔥 resto com throttle
    stream.pause();

    res.write(chunk, () => {
      setTimeout(() => {
        stream.resume();
      }, 10);
    });
  });

  stream.on("end", () => {
    console.log("✅ Stream finished");
    res.end();
  });

  stream.on("error", (err) => {
    console.error("❌ Stream error:", err);
    res.end();
  });
});

app.get("/api/voice", async (req, res) => {
  const text = req.query.text;

  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }

  console.log("🗣️ TTS:", text);

  await textToSpeech(text, res);
});

app.listen(config.PORT, () => {
  console.log(`🚀 ARGUS running on port ${config.PORT}`);
});