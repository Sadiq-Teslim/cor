import { Router, Request, Response } from "express";
import { dataStore } from "../store/supabase-store";
import { getHealthContext } from "../utils/css-engine";
import { generateResponse } from "../services/groq.service";

const router = Router();

/**
 * GET /api/tip/today
 * Screen 7: Get today's personalized health tip
 */
router.get("/today", async (req: Request, res: Response) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: "User ID is required", code: "MISSING_USER_ID" },
      });
    }

    const user = await dataStore.getUser(userId as string);
    const readings = await dataStore.getReadings(userId as string, 7);
    const baseline = await dataStore.getBaseline(userId as string);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found", code: "USER_NOT_FOUND" },
      });
    }

    let tip = "";
    let category = "general";

    if (baseline && readings.length > 0) {
      const healthContext = getHealthContext(readings, baseline);
      const todayReading = readings[readings.length - 1];

      // Generate personalized tip using Groq
      try {
        const tipPrompt = `Generate a short, actionable health tip (max 2 sentences) in ${user.preferredLanguage} based on:
        - CSS trend: ${healthContext.trend}
        - Sleep quality: ${todayReading.sleepQuality}/10
        - Sedentary hours: ${todayReading.sedentaryHours}
        - HRV change: ${healthContext.hrvDelta}%
        
        Be specific and actionable. Examples: "Take a 10-minute walk after lunch" or "Aim for 7 hours of sleep tonight".
        Respond ONLY with the tip, no quotes.`;

        tip = await generateResponse(
          tipPrompt,
          user.preferredLanguage,
          healthContext as any,
          userId
        );

        // Determine category based on context
        if (healthContext.trend === "worsening") {
          category = "stress_management";
        } else if (todayReading.sleepQuality < 6) {
          category = "sleep";
        } else if (todayReading.sedentaryHours > 6) {
          category = "activity";
        } else {
          category = "maintenance";
        }
      } catch (error) {
        // Fallback tips
        if (healthContext.trend === "worsening") {
          tip = "Take a 20-minute walk today to help manage stress.";
        } else if (todayReading.sleepQuality < 6) {
          tip = "Aim for 7-8 hours of sleep tonight for better cardiovascular health.";
        } else {
          tip = "Keep up the good work! Stay hydrated and take regular breaks.";
        }
      }
    } else {
      // Default tip for new users
      tip =
        user.preferredLanguage === "yo"
          ? "Bẹ̀rẹ̀ pẹ̀lú ìwé rẹ̀ àkọ́kọ́ láti ṣètò ìpìlẹ̀ rẹ."
          : user.preferredLanguage === "ha"
          ? "Fara da karatun ku na farko don saita ma'aunin ku."
          : "Start with your first reading to establish your baseline.";
    }

    res.json({
      success: true,
      data: {
        tip,
        category,
        language: user.preferredLanguage,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "TIP_GENERATION_ERROR" },
    });
  }
});

export default router;

