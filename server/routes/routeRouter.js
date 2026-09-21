import { Router } from "express";
import { analyzeRoute } from "../services/aiService.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { message, preferences = [], language = "id", requestedOutput = [] } = req.body || {};

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return res.status(400).json({ error: "message wajib diisi minimal 5 karakter" });
    }

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: "preferences harus berupa array" });
    }

    const result = await analyzeRoute({ message, preferences, language, requestedOutput });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;