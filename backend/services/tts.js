import fetch from "node-fetch";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/env.js";

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEBUG_DIR = path.join(__dirname, "../debug");

if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR);
}

// ==========================
// 🔊 TTS
// ==========================
export async function textToSpeech(text, res) {
  try {

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
        input: text
      })
    });

    const raw = await ttsRes.arrayBuffer();

    if (!ttsRes.ok) {
      const errText = Buffer.from(raw).toString("utf-8");
      console.error("❌ TTS ERROR:", errText);
      throw new Error("TTS falhou");
    }

    const mp3Buffer = Buffer.from(raw);

    // ==========================
    // 💾 SAVE MP3 RAW (debug)
    // ==========================
    const timestamp = Date.now();
    const mp3Path = path.join(DEBUG_DIR, `output_${timestamp}.mp3`);
    fs.writeFileSync(mp3Path, mp3Buffer);

    console.log("💾 MP3 guardado:", mp3Path);

    // ==========================
    // 🔥 CONVERTER PARA WAV REAL
    // ==========================
    const wavPath = path.join(DEBUG_DIR, `output_${timestamp}.wav`);

    await new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .audioFrequency(16000)   // 🔥 alinhado com ESP32
        .audioChannels(1)
        .audioCodec("pcm_s16le")
        .format("wav")
        .on("end", resolve)
        .on("error", reject)
        .save(wavPath);
    });

    const wavBuffer = fs.readFileSync(wavPath);

    console.log("🔊 WAV size:", wavBuffer.length);
    console.log("💾 WAV guardado:", wavPath);

    // ==========================
    // 🔥 RESPONSE
    // ==========================
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", wavBuffer.length);
    res.setHeader("Connection", "close");
    res.setHeader("Cache-Control", "no-cache");

    return res.send(wavBuffer);

  } catch (err) {
    console.error("❌ TTS FAIL:", err.message);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Erro ao gerar áudio"
      });
    }
  }
}