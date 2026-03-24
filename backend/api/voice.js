import express from "express";
import { sendToN8N } from "../services/n8nClient.js";

const router = express.Router();

router.post("/voice", async (req, res) => {
  try {
    const { text, audio, sessionId, device } = req.body;

    if (!text && !audio) {
      return res.status(400).json({
        error: "Missing 'text' or 'audio'"
      });
    }

    const payload = {
      sessionId: sessionId || "anonymous",
      device: device || "unknown",
      text: text || null,
      audio: audio || null,
      source: "ARGUS_API",
      timestamp: new Date().toISOString()
    };

    const n8nResponse = await sendToN8N(payload);

    return res.json({
      success: true,
      reply: n8nResponse.reply || n8nResponse.aiText || "No response",
      audio: n8nResponse.audio || null,
      userText: n8nResponse.userText || null
    });

  } catch (err) {
    console.error("VOICE ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;