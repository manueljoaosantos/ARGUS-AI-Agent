import express from "express";
import multer from "multer";
import { sendToFlowise } from "../services/flowiseClient.js";
import { speechToText } from "../services/stt.js";
import { textToSpeech } from "../services/tts.js";

const router = express.Router();
const upload = multer();

// 🎤 endpoint principal
router.post("/voice", upload.single("file"), async (req, res) => {
  try {
    const body = req.body || {};

    let text = body.text || null;
    const sessionId = body.sessionId || "anonymous";
    const device = body.device || "unknown";

    const isAudio = !!req.file;

    console.log("📥 INPUT:", { text, isAudio });

    // 🔥 1. STT (se vier áudio)
    if (isAudio && req.file) {
      console.log("🎤 A converter áudio para texto...");
      text = await speechToText(req.file.buffer);

      if (!text) {
        console.error("❌ STT falhou");
        return res.status(400).json({
          success: false,
          error: "Não foi possível reconhecer o áudio"
        });
      }

      text = normalizeText(text);

      console.log("📝 Texto reconhecido:", text);
    }

    // ⚠️ validação
    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Sem texto após STT"
      });
    }

    // 🔥 2. preparar payload para Flowise
    const payload = {
      question: text,
      sessionId: sessionId || crypto.randomUUID()
    };

    // 🔥 3. chamar Flowise (Agent)
    const flowiseResponse = await sendToFlowise(payload);
    console.log("🔥 USED TOOLS:", flowiseResponse.usedTools);
    let reply = "Não consegui responder.";

    if (flowiseResponse?.usedTools?.length > 0) {
      try {
        const toolData = JSON.parse(
          flowiseResponse.usedTools[0].toolOutput
        );

        reply = toolData.text || toolData.reply || reply;
      } catch (e) {
        console.error("Erro ao parse toolOutput:", e);
      }
    } else {
      reply =
        flowiseResponse?.text ||
        flowiseResponse?.reply ||
        reply;
    }

    console.log("🤖 Flowise:", reply);

    // 🔥 4. TTS (texto → áudio)
    let audio = null;
    let mimeType = "audio/mpeg"; // fallback

    if (reply && reply !== "Não consegui responder.") {
      console.log("🔊 A gerar áudio...");

      const tts = await textToSpeech(reply);

      audio = tts.audio;
      mimeType = tts.mimeType || mimeType;
    }

    // 🔥 resposta final
    return res.json({
      success: true,
      data: {
        reply,
        audio,
        mimeType, // ✅ agora existe
        userText: text,
        sessionId,
        device
      },
      error: null
    });

  } catch (err) {
    console.error("❌ VOICE ERROR:", err);

    return res.status(500).json({
      success: false,
      data: null,
      error: err.message
    });
  }
});

function normalizeText(text) {
  return text
    .normalize("NFC") // 🔥 corrige encoding
    .replace(/�/g, "á") // fallback básico
    .replace(/est��/gi, "está")
    .replace(/temperatura/gi, "temperatura")
    .trim();
}

export default router;