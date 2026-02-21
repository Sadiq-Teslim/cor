import { Router, Request, Response } from "express";
import path from "path";
import { existsSync } from "fs";

const router = Router();

/**
 * GET /api/audio/:category/:language/:filename
 * Serve pre-generated audio files
 */
router.get("/:category/:language/:filename", (req: Request, res: Response) => {
  try {
    const { category, language, filename } = req.params;

    // Validate inputs
    const validCategories = ["onboarding", "instructions", "confirmations"];
    const validLanguages = ["en", "yo", "ha", "pcm", "ig", "fr"];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid category", code: "INVALID_CATEGORY" },
      });
    }

    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid language", code: "INVALID_LANGUAGE" },
      });
    }

    // Construct file path
    const filePath = path.join(
      __dirname,
      "../../public/audio",
      category,
      language,
      filename
    );

    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { message: "Audio file not found", code: "FILE_NOT_FOUND" },
      });
    }

    // Send file
    res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "AUDIO_SERVE_ERROR" },
    });
  }
});

export default router;

