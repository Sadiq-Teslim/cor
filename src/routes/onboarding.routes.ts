import { Router, Request, Response } from "express";
import { dataStore } from "../store/supabase-store";

const router = Router();

/**
 * POST /api/onboarding/answer
 * Screen 3: Save individual onboarding answer
 */
router.post("/answer", async (req: Request, res: Response) => {
  try {
    const { userId, questionKey, answer } = req.body;

    if (!userId || !questionKey) {
      return res.status(400).json({
        success: false,
        error: {
          message: "User ID and question key are required",
          code: "MISSING_FIELDS",
        },
      });
    }

    await dataStore.saveOnboardingAnswer(
      userId,
      questionKey,
      typeof answer === "string" ? answer : JSON.stringify(answer),
      answer
    );

    res.json({
      success: true,
      message: "Answer saved",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "ANSWER_SAVE_ERROR" },
    });
  }
});

/**
 * GET /api/onboarding/answers
 * Get all onboarding answers for a user (for Groq context)
 */
router.get("/answers", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: "User ID is required", code: "MISSING_USER_ID" },
      });
    }

    const answers = await dataStore.getOnboardingAnswers(userId as string);

    res.json({
      success: true,
      data: { answers },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "ANSWERS_FETCH_ERROR" },
    });
  }
});

export default router;

