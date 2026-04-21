import { config } from "../../config/env.js";
import { ttsOpenAI } from "./openai.js";
import { ttsPiper } from "./piper.js";

export async function textToSpeech(text, res) {
  if (!text || text.trim() === "") {
    throw new Error("Texto vazio para TTS");
  }

  try {
    if (config.TTS_PROVIDER === "piper") {
      return await ttsPiper(text, res);
    }

    return await ttsOpenAI(text, res);

  } catch (err) {
    console.error("❌ TTS fallback:", err);
    return ttsOpenAI(text, res);
  }
}