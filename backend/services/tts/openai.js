import fetch from "node-fetch";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../../config/env.js";

ffmpeg.setFfmpegPath(ffmpegPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ttsOpenAI(text, res) {
  let tmpMp3;
  let tmpWav;

  try {
    const url = `${config.OPENAI_BASE_URL}/audio/speech`;

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
      throw new Error(Buffer.from(raw).toString("utf-8"));
    }

    const mp3Buffer = Buffer.from(raw);

    // 🔥 nomes únicos (evita colisões)
    const id = process.hrtime.bigint();
    tmpMp3 = path.join(__dirname, `tmp_${id}.mp3`);
    tmpWav = path.join(__dirname, `tmp_${id}.wav`);

    fs.writeFileSync(tmpMp3, mp3Buffer);

    // 🔥 conversão robusta
    await new Promise((resolve, reject) => {
      ffmpeg(tmpMp3)
        .audioCodec("pcm_s16le")
        .audioFrequency(16000)
        .audioChannels(1)
        .format("wav")
        .outputOptions([
          "-f wav",
          "-acodec pcm_s16le",
          "-ar 16000",
          "-ac 1"
        ])
        .on("end", resolve)
        .on("error", reject)
        .save(tmpWav);
    });

    const wavBuffer = fs.readFileSync(tmpWav);

    res.setHeader("Content-Type", "audio/wav");
    res.send(wavBuffer);

  } catch (err) {
    console.error("❌ TTS OpenAI:", err.message);

    if (!res.headersSent) {
      res.status(500).json({ error: "TTS falhou" });
    }

  } finally {
    // 🔥 cleanup garantido (mesmo com erro)
    try {
      if (tmpMp3 && fs.existsSync(tmpMp3)) {
        fs.unlinkSync(tmpMp3);
      }
      if (tmpWav && fs.existsSync(tmpWav)) {
        fs.unlinkSync(tmpWav);
      }
    } catch (cleanupErr) {
      console.error("⚠️ Cleanup error:", cleanupErr.message);
    }
  }
}