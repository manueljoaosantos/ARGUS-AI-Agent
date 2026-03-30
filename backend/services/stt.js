import fetch from "node-fetch";
import FormData from "form-data";
import { config } from "../config/env.js";

export async function speechToText(buffer) {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error("Buffer de áudio vazio");
    }

    console.log("🎤 AUDIO SIZE:", buffer.length);

    const formData = new FormData();

    formData.append("file", buffer, {
      filename: "audio.webm",
      contentType: "audio/webm"
    });

    formData.append("model", config.STT_MODEL || "whisper-1");
    formData.append("language", config.STT_LANGUAGE || "pt");

    // 🔥 ajuda o modelo a interpretar melhor PT-PT
    formData.append(
      "prompt",
      "Fala em português de Portugal corretamente."
    );

    const res = await fetch(
      `${config.OPENAI_BASE_URL}/audio/transcriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders() // 🔥 CRÍTICO
        },
        body: formData
      }
    );

    const data = await res.json();

    console.log("🧠 STT RAW:", data);

    // ❌ erro da API
    if (!res.ok) {
      console.error("❌ STT ERROR:", data);
      throw new Error(data?.error?.message || "Erro no STT");
    }

    // ❌ resposta inválida
    if (!data.text) {
      console.warn("⚠️ STT sem texto");
      return null;
    }

    return data.text;

  } catch (err) {
    console.error("❌ STT FAIL:", err.message);
    return null; // 🔥 importante para não crashar backend
  }
}