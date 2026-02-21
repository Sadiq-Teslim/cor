import { Router, Request, Response } from "express";
import { dataStore } from "../store/supabase-store";

const router = Router();

/**
 * GET /api/settings/:userId
 * Screen 15: Get user settings
 */
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await dataStore.getUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found", code: "USER_NOT_FOUND" },
      });
    }

    // Get settings from user data
    // In production, you might have a separate settings table
    res.json({
      success: true,
      data: {
        language: user.preferredLanguage,
        wakeWordEnabled: true, // Default - can be stored in DB later
        smartwatchConnected: user.smartwatchConnected,
        smartwatchType: user.smartwatchType,
        notificationsEnabled: true, // Default
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "SETTINGS_FETCH_ERROR" },
    });
  }
});

/**
 * PUT /api/settings/:userId
 * Screen 15: Update user settings
 */
router.put("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const {
      language,
      wakeWordEnabled,
      smartwatchConnected,
      smartwatchType,
      notificationsEnabled,
    } = req.body;

    const updates: any = {};
    if (language !== undefined) updates.preferredLanguage = language;
    if (smartwatchConnected !== undefined)
      updates.smartwatchConnected = smartwatchConnected;
    if (smartwatchType !== undefined) updates.smartwatchType = smartwatchType;

    const updated = await dataStore.updateUser(userId, updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found", code: "USER_NOT_FOUND" },
      });
    }

    res.json({
      success: true,
      data: {
        settings: {
          language: updated.preferredLanguage,
          wakeWordEnabled: wakeWordEnabled ?? true,
          smartwatchConnected: updated.smartwatchConnected,
          smartwatchType: updated.smartwatchType,
          notificationsEnabled: notificationsEnabled ?? true,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "SETTINGS_UPDATE_ERROR" },
    });
  }
});

export default router;

