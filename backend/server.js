import express from "express";
import cors from "cors";
import "dotenv/config";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./config/env.js";
//import { textToSpeech } from "./services/tts.js";
import { sendToFlowise } from "./services/flowiseClient.js";
//import { speechToText } from "./services/stt.js";
import { speechToText } from "./services/stt/index.js";
import { textToSpeech } from "./services/tts/index.js";
import { argusPrompt } from "./llm.js";
import mqttClient from "./services/mqttClient.js";
import topics from "./services/topics.js";

//const mqttClient = require("./services/mqttClient.js");

const app = express();
const upload = multer();

// ==========================
// 🔥 DEBUG ENV (REMOVER EM PROD)
// ==========================
console.log("FLOWISE_URL:", process.env.FLOWISE_URL);
console.log("FLOWISE_CHATFLOW_ID:", process.env.FLOWISE_CHATFLOW_ID);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEBUG_DIR = path.join(__dirname, "debug");

global.argusPublish = mqttClient.publish;

if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR);
}


// ==========================
// 🔥 MIDDLEWARE
// ==========================
app.use(cors({ origin: config.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "50mb" }));

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

  // 🔥 prioridade a tools
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

function mockAI(input) {
  const text = input.toLowerCase();

  if (text.includes("olá")) return "Olá humano 👁️";
  if (text.includes("porta")) return "A porta está segura.";
  if (text.includes("foto")) return "A capturar imagem.";
  if (text.includes("quem és")) return "Sou o ARGUS.";

  return "Recebido.";
}
/*
async function processVoice(data) {
  let text = data.text;

  const reply = mockAI(text);

  return {
    text: reply,
    device: data.device
  };
}
*/
async function processVoice(data) {
  let text = data.text;

  // STT se vier áudio
  if (data.audio) {
    text = await speechToText(Buffer.from(data.audio, "base64"));
  }

  if (!text) return null;

  let reply;

  try {
    const flowiseResponse = await sendToFlowise({
      question: text,
      sessionId: data.sessionId || "mqtt"
    });

    reply = resolveReply(flowiseResponse);

  } catch (err) {
    console.error("❌ Flowise error:", err.message);

    // fallback inteligente
    reply = "Erro ao comunicar com o assistente.";
  }

  return {
    text: reply,
    device: data.device || "unknown"
  };
}

mqttClient.registerHandlers({
  handleVoiceInput: async (data) => {
    try {
      console.log("🎤 MQTT voice input:", data);

      const result = await processVoice(data);

      if (!result) return;

      mqttClient.publish(topics.VOICE_OUTPUT, result);

    } catch (err) {
      console.error("❌ MQTT voice error:", err);
    }
  },

  handleEvent: async (data) => {
    console.log("📡 MQTT event:", data);
  }
});

// ==========================
// 🎤 GET (modo antigo - texto)
// ==========================
app.get("/api/voice", async (req, res) => {
  try {
    let text = req.query.text;
    const sessionId = req.query.sessionId || "esp32";
    const ttsOnly = req.query.tts === "1";

    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    console.log("📥 INPUT:", text);

    // 🔊 só TTS
    if (ttsOnly) {
      return await textToSpeech(text, res);
    }

    // 🧠 Flowise
    const flowiseResponse = await sendToFlowise({
      question: text,
      sessionId
    });

    const rawReply = resolveReply(flowiseResponse);

    // 🔥 preparar versões
    const safeText = normalizeForESP32(text);
    const safeReply = normalizeForESP32(rawReply);

    console.log("🧠 FINAL:", safeReply);

    const b64 = (str) => Buffer.from(str, "utf-8").toString("base64");

    res.setHeader("Connection", "close");
    res.setHeader("X-User-Text", b64(safeText));
    res.setHeader("X-AI-Reply", b64(safeReply));

    return await textToSpeech(rawReply, res);

  } catch (err) {
    console.error("❌ GET ERROR:", err.message);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
});

// ==========================
// 🎤 POST (NOVO - áudio)
// ==========================
/*app.post("/api/voice", upload.single("file"), async (req, res) => {
  try {
    
    const body = req.body || {};
    const sessionId = body.sessionId || "esp32";
    let text = body.text || null;

    console.log("📥 INPUT:", {
      hasAudio: !!req.file,
      text
    });

    console.log("🎧 AUDIO SIZE:", req.file?.buffer?.length);
    // ==========================
    // 💾 GUARDAR AUDIO INPUT
    // ==========================
    if (req.file?.buffer) {
      const data = Date.now();
      const inputFile = path.join(DEBUG_DIR, `input_${data}.wav`);
      fs.writeFileSync(inputFile, req.file.buffer);
      console.log("💾 INPUT guardado:", inputFile);
    }

    // ==========================
    // 🎤 STT
    // ==========================
    if (req.file) {
      console.log("🎤 A converter áudio...");

      text = await speechToText(req.file.buffer);

      if (!text) {
        return res.status(400).json({
          error: "Não foi possível reconhecer o áudio"
        });
      }

      console.log("📝 TEXTO:", text);
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({
        error: "Sem texto"
      });
    }

    // ==========================
    // 🧠 FLOWISE
    // ==========================
    const flowiseResponse = await sendToFlowise({
      question: text,
      sessionId
    });

    const rawReply = resolveReply(flowiseResponse);

    // ==========================
    // 🔧 NORMALIZA
    // ==========================
    const safeText = normalizeForESP32(text);
    const safeReply = normalizeForESP32(rawReply);

    console.log("🧠 FINAL:", safeReply);

    // ==========================
    // 🔥 HEADERS
    // ==========================
    const b64 = (str) =>
      Buffer.from(str, "utf-8").toString("base64");

    res.setHeader("Connection", "close");
    res.setHeader("X-User-Text", b64(safeText));
    res.setHeader("X-AI-Reply", b64(safeReply));

    // ==========================
    // 🔊 TTS
    // ==========================
    return await textToSpeech(rawReply, res);

  } catch (err) {
    console.error("❌ POST ERROR:", err.message);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
});
*/
app.post("/api/voice", upload.single("file"), async (req, res) => {
  try {
    const body = req.body || {};
    const sessionId = body.sessionId || "esp32";
    let text = body.text || null;

    let audioBuffer = null;

    console.log("📥 INPUT:", {
      hasMulterAudio: !!req.file,
      hasRawAudio: !req.file,
      text
    });

    // ==========================
    // 🎧 DETETAR TIPO DE INPUT
    // ==========================

    if (req.file?.buffer) {
      // ✅ MODO MULTER (frontend/testes)
      audioBuffer = req.file.buffer;
      console.log("🎧 MULTER AUDIO SIZE:", audioBuffer.length);

    } else {
      // ✅ MODO RAW (ESP32)
      const chunks = [];

      await new Promise((resolve, reject) => {
        req.on("data", chunk => chunks.push(chunk));
        req.on("end", resolve);
        req.on("error", reject);
      });

      audioBuffer = Buffer.concat(chunks);
      console.log("🎧 RAW AUDIO SIZE:", audioBuffer.length);
    }

    // ==========================
    // ⚠️ VALIDAÇÃO
    // ==========================
    if (audioBuffer && audioBuffer.length < 8000) {
      console.warn("⚠️ áudio demasiado curto");
      return res.status(400).json({
        error: "Áudio demasiado curto"
      });
    }

    // ==========================
    // 💾 GUARDAR AUDIO INPUT
    // ==========================
    if (audioBuffer) {
      const timestamp = Date.now();
      const inputFile = path.join(
        DEBUG_DIR,
        `input_${timestamp}.wav`
      );

      fs.writeFileSync(inputFile, audioBuffer);
      console.log("💾 INPUT guardado:", inputFile);
    }

    // ==========================
    // 🎤 STT
    // ==========================
    if (audioBuffer) {
      console.log("🎤 A converter áudio...");

      text = await speechToText(audioBuffer);

      if (!text || text.trim() === "") {
        console.warn("⚠️ STT sem texto válido");
        return res.status(400).json({
          error: "Não foi possível reconhecer o áudio"
        });
      }

      console.log("📝 TEXTO:", text);
    }

    // ==========================
    // ❌ VALIDAÇÃO FINAL
    // ==========================
    if (!text || text.trim() === "") {
      return res.status(400).json({
        error: "Sem texto"
      });
    }

    // ==========================
    // 🧠 FLOWISE
    // ==========================
    const flowiseResponse = await sendToFlowise({
      question: text,
      sessionId
    });

    const rawReply = resolveReply(flowiseResponse);

    // ==========================
    // 🔧 NORMALIZA
    // ==========================
    const safeText = normalizeForESP32(text);
    const safeReply = normalizeForESP32(rawReply);

    console.log("🧠 FINAL:", safeReply);

    // ==========================
    // 💾 GUARDAR TEXTO
    // ==========================
    const timestamp = Date.now();
    const textFile = path.join(
      DEBUG_DIR,
      `reply_${timestamp}.txt`
    );

    fs.writeFileSync(textFile, safeReply);

    // ==========================
    // 🔥 HEADERS
    // ==========================
    const b64 = (str) =>
      Buffer.from(str, "utf-8").toString("base64");

    res.setHeader("Connection", "close");
    res.setHeader("X-User-Text", b64(safeText));
    res.setHeader("X-AI-Reply", b64(safeReply));

    // ==========================
    // 🔊 TTS
    // ==========================
    return await textToSpeech(rawReply, res);

  } catch (err) {
    console.error("❌ POST ERROR:", err.message);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
});

app.get("/api/tts", async (req, res) => {
  try {
    const text = req.query.text || "Olá, como posso ajudar?";

    console.log("🔊 TTS GET:", text);

    if (!text || text.trim() === "") {
      return res.status(400).send("Texto vazio");
    }

    // 🔥 reutiliza a tua função existente
    return await textToSpeech(text, res);

  } catch (err) {
    console.error("❌ /api/tts ERROR:", err.message);

    if (!res.headersSent) {
      res.status(500).send("Erro interno");
    }
  }
});

app.get("/ai/test", async (req, res) => {
  const result = await generateResponse([
    {
      role: "system",
      content: "You are a helpful AI developer assistant.",
    },
    {
      role: "user",
      content: "Cria um endpoint simples em Node.js",
    },
  ]);

  res.send(result);
});

app.post("/ai/create-n8n-flow", async (req, res) => {
  const { description } = req.body;

  const prompt = `
    Cria um workflow para n8n com base nesta descrição:

    "${description}"

    Regras:
    - Output deve ser apenas JSON válido
    - Compatível com import do n8n
    - Incluir nodes básicos (trigger, ação)
    - Usar estrutura real do n8n (nodes, connections, etc.)
    - Não incluir explicações

    Formato esperado:
    {
      "nodes": [...],
      "connections": {...}
    }
`;

  const result = await argusPrompt(prompt);

  res.json({ flow: result });
});


// ==========================
// 🚀 START
// ==========================
app.listen(config.PORT, () => {
  console.log(`🚀 ARGUS running on port ${config.PORT}`);
});