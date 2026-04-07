import fetch from "node-fetch";
import { config } from "../config/env.js";

export async function textToSpeech(text, res) {
  const ttsRes = await fetch(`${config.OPENAI_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.TTS_MODEL,
      voice: config.TTS_VOICE,
      input: text,
      format: "mp3" // 🔥 perfeito para Audio.h
    })
  });

  if (!ttsRes.ok) {
    const err = await ttsRes.text();
    console.error("❌ TTS ERROR:", err);
    throw new Error("Erro no TTS");
  }

  // 🔥 carregar tudo para buffer (IMPORTANTE)
  const buffer = Buffer.from(await ttsRes.arrayBuffer());

  console.log("🔊 MP3 size:", buffer.length);

  // 🔥 headers corretos (SEM chunked)
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Length", buffer.length);

  // 🔥 enviar completo
  res.send(buffer);
}