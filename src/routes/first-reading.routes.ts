import { Router, Request, Response } from "express";
import { dataStore } from "../store/supabase-store";
import { estimateBPFromHRV, getBPCategory } from "../utils/bp-estimation";

const router = Router();

/**
 * POST /api/first-reading
 * Screen 6: First BP Reading - Establish baseline
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, hrv, heartRate } = req.body;

    if (!userId || !hrv) {
      return res.status(400).json({
        success: false,
        error: {
          message: "User ID and HRV are required",
          code: "MISSING_FIELDS",
        },
      });
    }

    const user = await dataStore.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found", code: "USER_NOT_FOUND" },
      });
    }

    // Estimate BP
    let bpEstimate = null;
    let message = "";
    let hrvStatus = "";

    // For first reading, we'll use population averages as baseline
    const estimatedBaselineHRV = 50; // Average HRV
    const estimate = estimateBPFromHRV(
      hrv,
      estimatedBaselineHRV,
      user.age,
      user.biologicalSex
    );

    // Generate plain language result
    if (hrv >= 45 && hrv <= 65) {
      hrvStatus = "normal";
      message = "Your heart rate looks normal. Your HRV suggests low stress today.";
    } else if (hrv < 45) {
      hrvStatus = "low";
      message = "Your HRV is lower than average, which may indicate elevated stress. This is your baseline - we'll track changes from here.";
    } else {
      hrvStatus = "high";
      message = "Your HRV is higher than average, indicating good cardiovascular health. This is your baseline.";
    }

    // Set this as baseline
    await dataStore.setBaseline(userId, {
      hrv,
      sedentaryHours: 5, // Default
      sleepQuality: 7, // Default
    });

    // Save the reading
    const today = new Date().toISOString().split("T")[0];
    await dataStore.addReading(userId, {
      date: today,
      hrv,
      heartRate,
      sedentaryHours: 0,
      sleepQuality: 7,
    });

    // Save BP reading
    await dataStore.addBPReading({
      userId,
      date: today,
      systolic: estimate.systolic,
      diastolic: estimate.diastolic,
      hrv,
      heartRate,
      confidence: estimate.confidence,
    });

    // Get BP category for risk indicator
    const category = getBPCategory(estimate.systolic, estimate.diastolic);

    res.json({
      success: true,
      data: {
        message,
        hrvStatus,
        reading: {
          systolic: estimate.systolic,
          diastolic: estimate.diastolic,
          hrv,
          heartRate,
          date: today,
        },
        bpEstimate: {
          systolic: estimate.systolic,
          diastolic: estimate.diastolic,
          confidence: estimate.confidence,
        },
        category,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "FIRST_READING_ERROR" },
    });
  }
});

export default router;

