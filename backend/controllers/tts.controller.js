import { textToSpeech } from "../services/tts/index.js";

export async function handleTTS(req, res) {
  try {
    const text = req.query.text;

    if (!text) {
      return res.status(400).send("Texto vazio");
    }

    return await textToSpeech(text, res);

  } catch (err) {
    console.error("❌ TTS ERROR:", err.message);
    res.status(500).send("Erro interno");
  }
}