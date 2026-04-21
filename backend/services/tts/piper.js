import { spawn } from "child_process";
import { config } from "../../config/env.js";

console.log("PIPER_PATH:", config.PIPER_PATH);
console.log("PIPER_MODEL:", config.PIPER_MODEL);

function createWavHeader(dataSize) {
  const header = Buffer.alloc(44);

  const sampleRate = 16000;
  const channels = 1;
  const bits = 16;

  const byteRate = sampleRate * channels * bits / 8;
  const blockAlign = channels * bits / 8;

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

  return header;
}

export async function ttsPiper(text, res) {
  return new Promise((resolve) => {
    const piper = spawn(config.PIPER_PATH, [
      "--model", config.PIPER_MODEL,
      "--output_raw"
    ]);

    let chunks = [];

    piper.stdout.on("data", (chunk) => {
      chunks.push(chunk);
    });

    piper.stderr.on("data", (err) => {
      console.error("Piper:", err.toString());
    });

    piper.on("close", () => {
      const raw = Buffer.concat(chunks);

      const header = createWavHeader(raw.length);
      const wav = Buffer.concat([header, raw]);

      res.setHeader("Content-Type", "audio/wav");
      res.send(wav);

      resolve();
    });

    piper.stdin.write(text);
    piper.stdin.end();
  });
}