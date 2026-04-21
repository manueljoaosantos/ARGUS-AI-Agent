import fs from "fs";
import { speechToText } from "./services/stt/index.js";

const audio = fs.readFileSync("./test.wav");

const text = await speechToText(audio);

console.log("RESULT:", text);