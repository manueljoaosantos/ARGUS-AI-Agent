import express from "express";
import cors from "cors";
import "dotenv/config";

import { config } from "./config/env.js";
import { textToSpeech } from "./services/tts.js";
import { sendToFlowise } from "./services/flowiseClient.js";

const app = express();

// ==========================
// 🔥 DEBUG ENV (REMOVER EM PROD)
// ==========================
console.log("FLOWISE_URL:", process.env.FLOWISE_URL);
console.log("FLOWISE_CHATFLOW_ID:", process.env.FLOWISE_CHATFLOW_ID);

// ==========================
// 🔥 MIDDLEWARE
// ==========================
app.use(cors({ origin: config.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "15mb" }));

app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// ==========================
// 🔍 ROOT
// ==========================
app.get("/", (req, res) => {
  res.send("ARGUS API running");
});

// ==========================
// 🔧 NORMALIZE PARA ESP32
// ==========================
function normalizeForESP32(text) {
  return text
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/\s+/g, " ")
    .trim();
}

// ==========================
// 🧠 RESOLVE REPLY
// ==========================
function resolveReply(res) {
  if (!res) return null;

  let reply =
    res.reply ||
    res.text ||
    res.response ||
    res.output ||
    res.outputs?.[0]?.output ||
    "";

  // 🔥 PRIORIDADE: TOOL (melhor UX)
  if (res.usedTools?.length > 0) {
    try {
      const tool = JSON.parse(res.usedTools[0].toolOutput);
      if (tool.text) {
        reply = tool.text;
      }
    } catch {
      console.warn("⚠️ erro a parse toolOutput");
    }
  }

  if (!reply || reply.trim() === "") {
    reply = "Desculpa, não consegui responder.";
  }

  return reply
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

// ==========================
// 🎤 VOICE ENDPOINT
// ==========================
app.get("/api/voice", async (req, res) => {
  try {
    const text = req.query.text;
    const sessionId = req.query.sessionId || "esp32";
    const ttsOnly = req.query.tts === "1";

        // 🔥 FIX ENCODING
    try {
      text = decodeURIComponent(text);
    } catch {
      console.warn("⚠️ decodeURIComponent falhou");
    }
    
    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    console.log("📥 INPUT:", text);

    // 🔊 TTS ONLY
    if (ttsOnly) {
      return await textToSpeech(text, res);
    }

    // 🧠 FLOWISE
    const flowiseResponse = await sendToFlowise({
      question: text,
      sessionId
    });

    const rawReply = resolveReply(flowiseResponse);

    // 🔥 TEXTO ORIGINAL (para áudio)
    const replyForAudio = rawReply;

    // 🔥 TEXTO LIMPO (para ESP32 display)
    const safeReply = normalizeForESP32(rawReply);
    const safeText = normalizeForESP32(text);

    console.log("🧠 FINAL:", safeReply);

    // 🔥 HEADERS (ESP32 lê isto)
    const b64 = (str) => Buffer.from(str, "utf-8").toString("base64");

    res.setHeader("Connection", "close");
    res.setHeader("X-User-Text", b64(safeText));
    res.setHeader("X-AI-Reply", b64(safeReply));

    // 🔊 ÁUDIO COM ACENTOS (IMPORTANTE)
    return await textToSpeech(replyForAudio, res);

  } catch (err) {
    console.error("❌ ERROR:", err.message);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
});

// ==========================
// 🚀 START
// ==========================
app.listen(config.PORT, () => {
  console.log(`🚀 ARGUS running on port ${config.PORT}`);
});