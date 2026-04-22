import fs from "fs";
import path from "path";
import { speechToText } from "../services/stt/index.js";
import { textToSpeech } from "../services/tts/index.js";
import { sendToFlowise } from "../services/flowiseClient.js";

import { resolveReply } from "../utils/reply.js";
import { normalizeText } from "../utils/normalize.js";
import { saveDebugAudio } from "../utils/debugAudio.js";

const DEBUG_DIR = path.resolve("./debug");

if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR);
}

export async function handleVoice(req, res) {
  try {
    let text = req.body?.text || null;
    const sessionId = req.body?.sessionId || "esp32";

    let audioBuffer = null;

    // ==========================
    // 🎧 INPUT DETECTION
    // ==========================
    if (req.file?.buffer) {
      audioBuffer = req.file.buffer;
    } else {
      const chunks = [];
      await new Promise((resolve, reject) => {
        req.on("data", chunk => chunks.push(chunk));
        req.on("end", resolve);
        req.on("error", reject);
      });
      audioBuffer = Buffer.concat(chunks);
    }

    // ==========================
    // 🎤 STT
    // ==========================
    if (audioBuffer && audioBuffer.length > 8000) {
      saveDebugAudio(audioBuffer, "input");
      text = await speechToText(audioBuffer);
    }

    if (!text) {
      return res.status(400).json({ error: "Sem texto válido" });
    }

    // ==========================
    // 🧠 FLOWISE
    // ==========================
    const flowiseResponse = await sendToFlowise({
      question: text,
      sessionId
    });

    const reply = resolveReply(flowiseResponse);

    const safeText = normalizeText(text);
    const safeReply = normalizeText(reply);

    // ==========================
    // HEADERS ESP32
    // ==========================
    const b64 = (str) => Buffer.from(str).toString("base64");

    res.setHeader("X-User-Text", b64(safeText));
    res.setHeader("X-AI-Reply", b64(safeReply));

    // ==========================
    // 🔊 TTS
    // ==========================
    return await textToSpeech(reply, res);

  } catch (err) {
    console.error("❌ VOICE ERROR:", err.message);
    return res.status(500).json({ error: "Erro interno" });
  }
}