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

    const tmpMp3 = path.join(__dirname, `tmp_${Date.now()}.mp3`);
    const tmpWav = path.join(__dirname, `tmp_${Date.now()}.wav`);

    fs.writeFileSync(tmpMp3, mp3Buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(tmpMp3)
        .audioFrequency(16000)
        .audioChannels(1)
        .audioCodec("pcm_s16le")
        .format("wav")
        .on("end", resolve)
        .on("error", reject)
        .save(tmpWav);
    });

    const wavBuffer = fs.readFileSync(tmpWav);

    fs.unlinkSync(tmpMp3);
    fs.unlinkSync(tmpWav);

    res.setHeader("Content-Type", "audio/wav");
    res.send(wavBuffer);

  } catch (err) {
    console.error("❌ TTS OpenAI:", err.message);

    if (!res.headersSent) {
      res.status(500).json({ error: "TTS falhou" });
    }
  }
}