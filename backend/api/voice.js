
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

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

// 🔥 RESOLVER RESPOSTA (FIX PRINCIPAL)
function resolveReply(flowiseResponse) {
  let reply = flowiseResponse?.text;

  // fallback para tool
  if (!reply || reply.trim() === "") {
    try {
      const tool = flowiseResponse?.usedTools?.[0];
      if (tool?.toolOutput) {
        const parsed = JSON.parse(tool.toolOutput);
        reply = parsed.text || parsed.reply;
      }
    } catch (e) {
      console.error("Tool parse error:", e);
    }
  }

  if (!reply || reply.trim() === "") {
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

      await textToSpeech(text, res);
      return;
    }

    const payload = {
      question: text,
      sessionId
    };

    const flowiseResponse = await sendToFlowise(payload);

    const reply = resolveReply(flowiseResponse);

    console.log("🤖 GET Flowise:", reply);

    // 🔥 HEADERS FIX
    res.setHeader("Connection", "close");
    res.setHeader("X-User-Text", b64(text));
    res.setHeader("X-AI-Reply", b64(reply));

    await textToSpeech(reply, res);

  } catch (err) {
    console.error("❌ GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= POST =================
router.post("/voice", upload.single("file"), async (req, res) => {
  try {
    const body = req.body || {};

    let text = body.text || null;
    const sessionId = body.sessionId || "anonymous";
    const device = body.device || "unknown";

    const isAudio = !!req.file;

    console.log("📥 INPUT:", { text, isAudio });

    const timestamp = Date.now();

    if (isAudio && req.file) {
      const inputPath = path.join(
        AUDIO_DIR,
        `${timestamp}_${device}_input.webm`
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

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Sem texto após STT"
      });
    }

    const payload = {
      question: text,
      sessionId: sessionId || crypto.randomUUID()
    };

    console.log("📡 PAYLOAD FLOWISE:", payload);

    const flowiseResponse = await sendToFlowise(payload);

    const reply = resolveReply(flowiseResponse);

    console.log("🤖 Flowise:", reply);

    const textLogPath = path.join(
      AUDIO_DIR,
      `${timestamp}_${device}_reply.txt`
    );
    fs.writeFileSync(textLogPath, reply);

    // 🔥 HEADERS FIX
    res.setHeader("Connection", "close");
    res.setHeader("X-User-Text", b64(text));
    res.setHeader("X-AI-Reply", b64(reply));

    if (reply && reply !== "Não consegui responder.") {
      console.log("🔊 A gerar áudio...");

      const originalSend = res.send.bind(res);

      res.send = (buffer) => {
        try {
          const outputPath = path.join(
            AUDIO_DIR,
            `${timestamp}_${device}_output.mp3`
          );

          fs.writeFileSync(outputPath, buffer);
          console.log("💾 AUDIO OUTPUT SAVED:", outputPath);

        } catch (err) {
          console.error("❌ ERRO A GUARDAR OUTPUT:", err);
        }

        return originalSend(buffer);
      };

      await textToSpeech(reply, res);
      return;
    }

  } catch (err) {
    console.error("❌ VOICE ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 🔥 NORMALIZE CLEAN (sem hacks perigosos)
function normalizeText(text) {
  return text
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

export default router;

