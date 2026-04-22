import express from "express";
import { handleTTS } from "../controllers/tts.controller.js";

const router = express.Router();

router.get("/", handleTTS);

export default router;