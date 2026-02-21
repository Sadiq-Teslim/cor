import { Router, Request, Response } from "express";
import multer from "multer";
import { analyzeFood } from "../services/logmeal.service";
import { dataStore } from "../store/supabase-store";
import { transcribeAudio } from "../services/groq.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/food/analyze
 * Analyze food image using Logmeal API
 */
router.post(
  "/analyze",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: "Image file is required", code: "MISSING_IMAGE" },
        });
      }

      const { userId } = req.body;
      const imageBuffer = req.file.buffer;

      const analysis = await analyzeFood(imageBuffer);

      // Store food log
      if (userId) {
        const today = new Date().toISOString().split("T")[0];
        await dataStore.addFoodLog({
          userId,
          date: today,
          foodName: analysis.foodName,
          calories: analysis.calories,
          sodium: analysis.sodium,
          bpImpact: analysis.bpImpact,
          method: "camera",
        });

        // Update today's reading with food impact
        const readings = await dataStore.getReadings(userId);
        const todayReading = readings.find((r) => r.date === today);
        if (todayReading) {
          // Convert bpImpact to foodImpact score (0-1)
          const foodImpact =
            analysis.bpImpact === "high"
              ? 0.8
              : analysis.bpImpact === "moderate"
              ? 0.4
              : 0.1;
          todayReading.foodImpact = foodImpact;
          await dataStore.addReading(userId, todayReading);
        }
      }

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message, code: "FOOD_ANALYSIS_ERROR" },
      });
    }
  }
);

/**
 * POST /api/food/voice
 * Screen 9: Log food via voice description
 */
router.post(
  "/voice",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: "Audio file is required", code: "MISSING_AUDIO" },
        });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: "User ID is required", code: "MISSING_USER_ID" },
        });
      }

      // Transcribe voice description
      const audioFile = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });
      const { text, language } = await transcribeAudio(audioFile);

      // Use Groq to extract food info from description
      const user = await dataStore.getUser(userId);
      const { generateResponse } = await import("../services/groq.service");
      const { getHealthContext } = await import("../utils/css-engine");
      const readings = await dataStore.getReadings(userId);
      const baseline = await dataStore.getBaseline(userId);
      const healthContext = getHealthContext(readings, baseline || null) as any;

      const extractionPrompt = `Extract food information from this description: "${text}"

Return JSON with:
{
  "foodName": "name of food",
  "calories": number (estimate),
  "sodium": number in mg (estimate),
  "bpImpact": "low" | "moderate" | "high"
}`;

      const extracted = await generateResponse(
        extractionPrompt,
        language,
        healthContext,
        userId
      );

      // Parse extracted data
      let analysis;
      try {
        const parsed = JSON.parse(extracted);
        const sodium = parsed.sodium || 0;
        let bpImpact: "low" | "moderate" | "high" = "low";
        let message = "Food logged successfully.";

        if (sodium > 2000) {
          bpImpact = "high";
          message = `This meal is high in sodium (${sodium}mg). Given your readings this week, it may elevate your blood pressure over the next few hours. Consider drinking water and reducing salt at your next meal.`;
        } else if (sodium > 1000) {
          bpImpact = "moderate";
          message = `This meal contains moderate sodium (${sodium}mg). Be mindful of your salt intake for the rest of the day.`;
        }

        analysis = {
          foodName: parsed.foodName || "Unknown food",
          calories: parsed.calories || 0,
          sodium,
          bpImpact,
          message,
        };
      } catch {
        // Fallback
        analysis = {
          foodName: text.substring(0, 50),
          bpImpact: "low" as const,
          message: "Food logged. Unable to analyze sodium content from description.",
        };
      }

      // Store food log
      const today = new Date().toISOString().split("T")[0];
      await dataStore.addFoodLog({
        userId,
        date: today,
        foodName: analysis.foodName,
        calories: analysis.calories,
        sodium: analysis.sodium,
        bpImpact: analysis.bpImpact,
        method: "voice",
      });

      // Update today's reading
      const readings2 = await dataStore.getReadings(userId);
      const todayReading = readings2.find((r) => r.date === today);
      if (todayReading) {
        const foodImpact =
          analysis.bpImpact === "high"
            ? 0.8
            : analysis.bpImpact === "moderate"
            ? 0.4
            : 0.1;
        todayReading.foodImpact = foodImpact;
        await dataStore.addReading(userId, todayReading);
      }

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { message: error.message, code: "FOOD_VOICE_ERROR" },
      });
    }
  }
);

export default router;

