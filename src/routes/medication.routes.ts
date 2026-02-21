import { Router, Request, Response } from "express";
import { dataStore } from "../store/supabase-store";

const router = Router();

/**
 * GET /api/medications
 * Get user's medications
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: "User ID is required", code: "MISSING_USER_ID" },
      });
    }

    const medications = await dataStore.getMedications(userId as string);

    res.json({
      success: true,
      data: { medications },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "MEDICATION_FETCH_ERROR" },
    });
  }
});

/**
 * POST /api/medications
 * Add a new medication
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId, name, affectsBP, dailyReminder, reminderTime } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        error: {
          message: "User ID and medication name are required",
          code: "MISSING_FIELDS",
        },
      });
    }

    // Check if medication affects BP (common BP-raising medications)
    const bpRaisingMeds = [
      "decongestant",
      "nsaid",
      "ibuprofen",
      "naproxen",
      "birth control",
      "oral contraceptive",
      "steroid",
      "prednisone",
      "antidepressant",
      "stimulant",
      "adderall",
      "ritalin",
    ];

    const nameLower = name.toLowerCase();
    const affectsBPFlag =
      affectsBP !== undefined
        ? affectsBP
        : bpRaisingMeds.some((med) => nameLower.includes(med));

    const medication = await dataStore.addMedication({
      userId,
      name,
      affectsBP: affectsBPFlag,
      dailyReminder: dailyReminder || false,
      reminderTime: reminderTime || undefined,
    });

    res.json({
      success: true,
      data: {
        medication,
        message: affectsBPFlag
          ? "This medication can raise blood pressure in some people. I'll factor this into your monitoring."
          : "Medication added successfully.",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "MEDICATION_ADD_ERROR" },
    });
  }
});

/**
 * PUT /api/medications/:medicationId
 * Update medication
 */
router.put("/:medicationId", async (req: Request, res: Response) => {
  try {
    const { medicationId } = req.params;
    const updates = req.body;

    const medication = await dataStore.updateMedication(
      medicationId,
      updates
    );

    if (!medication) {
      return res.status(404).json({
        success: false,
        error: { message: "Medication not found", code: "NOT_FOUND" },
      });
    }

    res.json({
      success: true,
      data: { medication },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "MEDICATION_UPDATE_ERROR" },
    });
  }
});

/**
 * DELETE /api/medications/:medicationId
 * Delete medication
 */
router.delete("/:medicationId", async (req: Request, res: Response) => {
  try {
    const { medicationId } = req.params;

    await dataStore.deleteMedication(medicationId);

    res.json({
      success: true,
      message: "Medication deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "MEDICATION_DELETE_ERROR" },
    });
  }
});

/**
 * POST /api/medications/:medicationId/log
 * Log when medication was taken
 */
router.post("/:medicationId/log", async (req: Request, res: Response) => {
  try {
    const { medicationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: "User ID is required", code: "MISSING_USER_ID" },
      });
    }

    const log = await dataStore.logMedication(medicationId, userId);

    res.json({
      success: true,
      data: { log },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "MEDICATION_LOG_ERROR" },
    });
  }
});

/**
 * GET /api/medications/logs
 * Get medication logs
 */
router.get("/logs", async (req: Request, res: Response) => {
  try {
    const { userId, days } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: "User ID is required", code: "MISSING_USER_ID" },
      });
    }

    const logs = await dataStore.getMedicationLogs(
      userId as string,
      days ? parseInt(days as string) : 7
    );

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message, code: "MEDICATION_LOGS_ERROR" },
    });
  }
});

export default router;

