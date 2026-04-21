import fs from "fs";
import os from "os";
import path from "path";
import { config } from "../../config/env.js";
import { execFile } from "child_process";

export async function sttWhisper(buffer) {
  try {
    const tmpFile = path.join(os.tmpdir(), `audio_${Date.now()}.wav`);
    fs.writeFileSync(tmpFile, buffer);

    return new Promise((resolve) => {
      execFile(
        config.WHISPER_PATH,
        [
          "-m", config.WHISPER_MODEL,
          "-f", tmpFile,
          "-l", "pt",
          "--no-timestamps"
        ],
        (err, stdout) => {
          fs.unlinkSync(tmpFile);

          if (err) {
            console.error("❌ whisper.cpp:", err.message);
            return resolve(null);
          }

          const text = stdout.trim();

          console.log("🧠 Whisper:", text);

          resolve(text || null);
        }
      );
    });

  } catch (err) {
    console.error("❌ Whisper STT FAIL:", err);
    return null;
  }
}