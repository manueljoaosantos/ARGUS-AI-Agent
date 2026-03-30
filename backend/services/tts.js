import fetch from "node-fetch";
import { config } from "../config/env.js";

export async function textToSpeech(text) {
  const res = await fetch(`${config.OPENAI_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.TTS_MODEL,
      voice: config.TTS_VOICE,
      input: text
    })
  });

  const contentType = res.headers.get("content-type");

  // 🔥 se não for áudio → erro
  if (!contentType || !contentType.startsWith("audio/")) {
    const errorText = await res.text();
    console.error("❌ TTS ERROR:", errorText);
    throw new Error("TTS não devolveu áudio válido");
  }

  const buffer = await res.arrayBuffer();

  return {
    audio: Buffer.from(buffer).toString("base64"),
    mimeType: contentType
  };
}