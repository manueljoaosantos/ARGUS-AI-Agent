import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import { sendToFlowise } from "../services/flowiseClient.js";
import { speechToText } from "../services/stt.js";
import { textToSpeech } from "../services/tts.js";

const router = express.Router();
const upload = multer();

// 📁 garantir pasta
const AUDIO_DIR = path.resolve("./logs/audio");

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// 🔥 BASE64 UTF8 SAFE
function b64(str) {
  return Buffer.from(str, "utf-8").toString("base64");
}

// ==========================
// 🧠 RESOLVE REPLY (UNIFICADO)
// ==========================
function resolveReply(res) {
  if (!res) return null;

  let reply =
    res.text ||
    res.response ||
    res.output ||
    "";

  // 🔧 fallback tools
  if (!reply && res.usedTools?.length > 0) {
    try {
      const tool = JSON.parse(res.usedTools[0].toolOutput);
      reply = tool.text || tool.reply || "";
    } catch (e) {
      console.warn("⚠️ Tool parse error");
    }
  }

  if (!reply) {
    reply = "Não consegui obter resposta.";
  }

  return reply.normalize("NFC");
}

// ================= GET =================
router.get("/voice", async (req, res) => {
  try {
    const text = req.query.text;
    const sessionId = req.query.sessionId || "esp32";
    const ttsOnly = req.query.tts === "1";

    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    console.log("📥 GET INPUT:", text);

    // 🔊 TTS ONLY
    if (ttsOnly) {
      console.log("🔊 TTS ONLY MODE");

      res.setHeader("Connection", "close");
      res.setHeader("X-User-Text", b64(text));
      res.setHeader("X-AI-Reply", b64(text));

      return await textToSpeech(text, res);
    }

    const flowiseResponse = await sendToFlowise({
      question: text,
      sessionId
    });

    const reply = resolveReply(flowiseResponse);

    console.log("🤖 GET Flowise:", reply);

    // 🔥 HEADERS FIX
    res.setHeader("Connection", "close");
    res.setHeader("X-User-Text", b64(text));
    res.setHeader("X-AI-Reply", b64(reply));

    return await textToSpeech(reply, res);

  } catch (err) {
    console.error("❌ GET ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ================= POST =================
router.post("/voice", upload.single("file"), async (req, res) => {
  try {
    const body = req.body || {};

    let text = body.text || null;
    const sessionId = body.sessionId || crypto.randomUUID();
    const device = body.device || "unknown";

    const isAudio = !!req.file;

    console.log("📥 INPUT:", { text, isAudio });

    const timestamp = Date.now();

    // 💾 guardar input áudio
    if (isAudio && req.file) {
      const inputPath = path.join(
        AUDIO_DIR,
        `${timestamp}_${device}_input.wav`
      );

      fs.writeFileSync(inputPath, req.file.buffer);
      console.log("💾 AUDIO INPUT SAVED:", inputPath);
    }

    // 🎤 STT
    if (isAudio && req.file) {
      console.log("🎤 A converter áudio para texto...");
      text = await speechToText(req.file.buffer);

      if (!text) {
        return res.status(400).json({
          success: false,
          error: "Não foi possível reconhecer o áudio"
        });
      }

      text = normalizeText(text);
      console.log("📝 Texto reconhecido:", text);
    }

    // ❌ validação final
    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Sem texto após STT"
      });
    }

    console.log("📡 PAYLOAD FLOWISE:", { text, sessionId });

    const flowiseResponse = await sendToFlowise({
      question: text,
      sessionId
    });

    const reply = resolveReply(flowiseResponse);

    console.log("🤖 Flowise:", reply);

    // 💾 guardar texto resposta
    const textLogPath = path.join(
      AUDIO_DIR,
      `${timestamp}_${device}_reply.txt`
    );
    fs.writeFileSync(textLogPath, reply);

    // 🔥 HEADERS FIX
    res.setHeader("Connection", "close");
    res.setHeader("X-User-Text", b64(text));
    res.setHeader("X-AI-Reply", b64(reply));

    // 🔊 gerar áudio
    if (reply && reply !== "Não consegui obter resposta.") {
      console.log("🔊 A gerar áudio...");

      const originalSend = res.send.bind(res);

      res.send = (buffer) => {
        try {
          const outputPath = path.join(
            AUDIO_DIR,
            `${timestamp}_${device}_output.wav`
          );

          fs.writeFileSync(outputPath, buffer);
          console.log("💾 AUDIO OUTPUT SAVED:", outputPath);

        } catch (err) {
          console.error("❌ ERRO A GUARDAR OUTPUT:", err);
        }

        return originalSend(buffer);
      };

      return await textToSpeech(reply, res);
    }

    // fallback (não devia acontecer)
    return res.json({ text: reply });

  } catch (err) {
    console.error("❌ VOICE ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==========================
// 🔥 NORMALIZE CLEAN
// ==========================
function normalizeText(text) {
  return text
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

export default router;