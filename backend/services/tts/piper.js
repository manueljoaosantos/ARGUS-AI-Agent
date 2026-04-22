import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ttsPiper(text, res) {
  let tmpRaw;
  let tmpWav;

  try {
    if (!config.PIPER_PATH || !config.PIPER_MODEL) {
      throw new Error("PIPER_PATH ou PIPER_MODEL não definidos");
    }

    // 🔥 nomes únicos (igual OpenAI)
    const id = process.hrtime.bigint();
    tmpRaw = path.join(__dirname, `tmp_${id}.raw`);
    tmpWav = path.join(__dirname, `tmp_${id}.wav`);

    // ==========================
    // 🔊 GERAR RAW (Piper)
    // ==========================
    await new Promise((resolve, reject) => {
      const piper = spawn(config.PIPER_PATH, [
        "--model", config.PIPER_MODEL,
        "--output_raw"
      ]);

      const writeStream = fs.createWriteStream(tmpRaw);

      piper.stdout.pipe(writeStream);

      piper.stderr.on("data", (data) => {
        console.error("Piper:", data.toString());
      });

      piper.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error("Piper terminou com erro"));
        }
        resolve();
      });

      piper.on("error", reject);

      piper.stdin.write(text);
      piper.stdin.end();
    });

    // ==========================
    // 🔊 CONVERTER RAW → WAV
    // ==========================
    const sampleRate = 22050; // 🔥 ajusta ao teu modelo!

    const rawBuffer = fs.readFileSync(tmpRaw);

    const header = Buffer.alloc(44);

    const channels = 1;
    const bits = 16;
    const byteRate = (sampleRate * channels * bits) / 8;
    const blockAlign = (channels * bits) / 8;
    const dataSize = rawBuffer.length;

    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);

    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bits, 34);

    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);

    const wavBuffer = Buffer.concat([header, rawBuffer]);

    // ==========================
    // 🔊 RESPONSE
    // ==========================
    res.setHeader("Content-Type", "audio/wav");
    res.send(wavBuffer);

  } catch (err) {
    console.error("❌ TTS Piper:", err.message);

    if (!res.headersSent) {
      res.status(500).json({ error: "TTS falhou" });
    }

  } finally {
    // 🔥 cleanup garantido
    try {
      if (tmpRaw && fs.existsSync(tmpRaw)) fs.unlinkSync(tmpRaw);
      if (tmpWav && fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
    } catch (e) {
      console.error("⚠️ Cleanup error:", e.message);
    }
  }
}