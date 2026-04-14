import fetch from "node-fetch";
import FormData from "form-data";
import { config } from "../config/env.js";

export async function speechToText(buffer) {
  try {
    // 🔒 validações
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não definida");
    }

    if (!buffer || buffer.length === 0) {
      throw new Error("Buffer de áudio vazio");
    }

    console.log("🎤 AUDIO SIZE:", buffer.length);

    const formData = new FormData();

    formData.append("file", buffer, {
      filename: "audio.wav",
      contentType: "audio/wav"
    });

    formData.append("model", config.STT_MODEL || "whisper-1");
    formData.append("language", config.STT_LANGUAGE || "pt");

    // 🇵🇹 ajuda PT-PT
    formData.append(
      "prompt",
      "Transcreve em português de Portugal corretamente."
    );

    const url = `${config.OPENAI_BASE_URL}/audio/transcriptions`;

    console.log("🌐 STT URL:", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders() // 🔥 obrigatório
      },
      body: formData
    });

    const responseBuffer = await res.arrayBuffer();
    const raw = new TextDecoder("utf-8").decode(responseBuffer);

    console.log("📦 STT RAW:", raw);

    // ❌ erro HTTP
    if (!res.ok) {
      throw new Error(`STT error ${res.status}: ${raw}`);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      throw new Error("Erro a fazer parse da resposta STT");
    }

    console.log("🧠 STT JSON:", data);

    // ❌ resposta inválida
    if (!data?.text || data.text.trim() === "") {
      console.warn("⚠️ STT sem texto válido");
      return null;
    }

    // 🔥 normalização leve (evita bugs downstream)
    return data.text
      .normalize("NFC")
      .replace(/\s+/g, " ")
      .trim();

  } catch (err) {
    console.error("❌ STT FAIL:", err.message);

    // 🔥 nunca crasha backend
    return null;
  }
}