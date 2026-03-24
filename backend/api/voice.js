import express from "express";
import { sendToN8N } from "../services/n8nClient.js";

const router = express.Router();

router.post("/voice", async (req, res) => {
  try {
    // 🔥 garantir que nunca é undefined
    const body = req.body || {};

    const text = body.text || null;
    const audio = body.audio || null;
    const sessionId = body.sessionId || "anonymous";
    const device = body.device || "unknown";

    // 🔥 detectar se vem áudio (FormData)
    const isAudio = req.headers["content-type"]?.includes("multipart/form-data");

    // ⚠️ validação inteligente
    if (!text && !audio && !isAudio) {
      return res.status(400).json({
        success: false,
        error: "Missing 'text' or audio input"
      });
    }

    const payload = {
      sessionId,
      device,
      text,
      audio,
      isAudio, // 🔥 importante para n8n
      source: "ARGUS_API",
      timestamp: new Date().toISOString()
    };

    const n8nResponse = await sendToN8N(payload);

    return res.json({
      success: true,
      data: {
        reply: n8nResponse.reply || n8nResponse.aiText || "",
        audio: n8nResponse.audio || null,
        userText: n8nResponse.userText || text,
        sessionId
      },
      error: null
    });

  } catch (err) {
    console.error("VOICE ERROR:", err);

    return res.status(500).json({
      success: false,
      data: null,
      error: err.message
    });
  }
});

export default router;