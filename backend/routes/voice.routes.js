import express from "express";
import multer from "multer";
import { handleVoice } from "../controllers/voice.controller.js";

const router = express.Router();
const upload = multer();

router.post("/", upload.single("file"), handleVoice);

export default router;