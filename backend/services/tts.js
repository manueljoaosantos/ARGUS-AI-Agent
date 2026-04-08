import fetch from "node-fetch";
import { config } from "../config/env.js";

export async function textToSpeech(text, res) {
  try {
    // 🔒 validações
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não definida");
    }

    if (!text || text.trim() === "") {
      throw new Error("Texto vazio para TTS");
    }

    const url = `${config.OPENAI_BASE_URL}/audio/speech`;

    console.log("🔊 TTS REQUEST:", {
      model: config.TTS_MODEL,
      voice: config.TTS_VOICE,
      length: text.length
    });

    const ttsRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.TTS_MODEL,
        voice: config.TTS_VOICE,
        input: text,
        format: "mp3"
      })
    });

    const raw = await ttsRes.arrayBuffer();

    // ❌ erro da API
    if (!ttsRes.ok) {
      const errText = Buffer.from(raw).toString("utf-8");
      console.error("❌ TTS ERROR:", errText);
      throw new Error(`TTS falhou (${ttsRes.status})`);
    }

    // 🔥 buffer completo (IMPORTANTE para ESP32)
    const buffer = Buffer.from(raw);

    if (!buffer || buffer.length === 0) {
      throw new Error("TTS devolveu buffer vazio");
    }

    console.log("🔊 MP3 size:", buffer.length);

    // 🔥 headers corretos (evita chunked)
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Connection", "close");

    // 🔥 enviar completo
    return res.send(buffer);

  } catch (err) {
    console.error("❌ TTS FAIL:", err.message);

    // fallback seguro
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Erro ao gerar áudio"
      });
    }
  }
}