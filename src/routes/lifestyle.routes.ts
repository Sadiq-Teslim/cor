import { Router, Request, Response } from "express";
import { dataStore } from "../store/supabase-store";
import { calculateCSS } from "../utils/css-engine";
import { generateResponse } from "../services/groq.service";
import { getHealthContext } from "../utils/css-engine";

const router = Router();

/**
 * GET /api/lifestyle/insights
 * Screen 11: Lifestyle Insights - Weekly narrative summary
 */
router.get("/insights", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: "User ID is required", code: "MISSING_USER_ID" },
      });
    }

    const user = await dataStore.getUser(userId as string);
    const readings = await dataStore.getReadings(userId as string, 7);
    const baseline = await dataStore.getBaseline(userId as string);
    const foodLogs = await dataStore.getFoodLogs(userId as string, 7);

    if (!user || !baseline || readings.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Insufficient data for insights",
          code: "INSUFFICIENT_DATA",
        },
      });
    }

    // Calculate week stats
    const sleepDisruptedNights = readings.filter((r) => r.sleepQuality < 6).length;
    const averageSedentaryHours =
      readings.reduce((sum, r) => sum + r.sedentaryHours, 0) / readings.length;
    const highSodiumMeals = foodLogs.filter(
      (f) => f.bpImpact === "high"
    ).length;
    const cssResult = calculateCSS(readings, baseline);
    const averageCSS = cssResult.score;

    // Generate narrative summary using Groq
    const healthContext = getHealthContext(readings, baseline);
    const statsPrompt = `Generate a warm, narrative paragraph (3-4 sentences) in ${user.preferredLanguage} summarizing the user's week:
    - Sleep disrupted ${sleepDisruptedNights} nights
    - Average sedentary: ${averageSedentaryHours.toFixed(1)} hours/day
    - High sodium meals: ${highSodiumMeals}
    - CSS trend: ${cssResult.trend}
    - Average CSS: ${averageCSS}/100
    
    Write like a caring friend, not a doctor. Be specific about patterns.`;

    let summary = "";
    let recommendation = "";

    try {
      summary = await generateResponse(
        statsPrompt,
        user.preferredLanguage,
        healthContext as any
      );

      // Generate recommendation
      const recPrompt = `Based on the week's data, give ONE specific, actionable recommendation (max 2 sentences) in ${user.preferredLanguage}. Be practical and encouraging.`;
      recommendation = await generateResponse(
        recPrompt,
        user.preferredLanguage,
        healthContext as any
      );
    } catch (error) {
      // Fallback narrative
      summary = `This week your sleep was disrupted on ${sleepDisruptedNights} nights and you were largely sedentary (${averageSedentaryHours.toFixed(1)} hours/day). This combination is putting your cardiovascular system under ${cssResult.trend === "worsening" ? "moderate to high" : "moderate"} stress.`;
      recommendation =
        "Try a 15-minute walk tomorrow morning and aim for bed by 10pm.";
    }

    res.json({
      success: true,
      data: {
        summary,
        recommendation,
        weekStats: {
          sleepDisruptedNights,
          averageSedentaryHours: Math.round(averageSedentaryHours * 10) / 10,
          highSodiumMeals,
          averageCSS,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "LIFESTYLE_INSIGHTS_ERROR" },
    });
  }
});

export default router;

