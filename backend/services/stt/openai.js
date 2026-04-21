import fetch from "node-fetch";
import FormData from "form-data";
import { config } from "../../config/env.js";

export async function sttOpenAI(buffer) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não definida");
    }

    const formData = new FormData();

    formData.append("file", buffer, {
      filename: "audio.wav",
      contentType: "audio/wav"
    });

    formData.append("model", config.STT_MODEL || "whisper-1");
    formData.append("language", config.STT_LANGUAGE || "pt");

    formData.append(
      "prompt",
      "Transcreve em português de Portugal corretamente."
    );

    const url = `${config.OPENAI_BASE_URL}/audio/transcriptions`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const raw = await res.text();

    if (!res.ok) {
      throw new Error(`STT error ${res.status}: ${raw}`);
    }

    const data = JSON.parse(raw);

    if (!data?.text) return null;

    return data.text
      .normalize("NFC")
      .replace(/\s+/g, " ")
      .trim();

  } catch (err) {
    console.error("❌ STT OpenAI:", err.message);
    return null;
  }
}