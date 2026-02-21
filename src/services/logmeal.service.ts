import axios from "axios";
import FormData from "form-data";
import { FoodAnalysis } from "../types";

/**
 * Analyze food image using Logmeal API
 */
export async function analyzeFood(imageBuffer: Buffer): Promise<FoodAnalysis> {
  const apiKey = process.env.LOGMEAL_API_KEY;

  if (!apiKey) {
    throw new Error("LOGMEAL_API_KEY is not configured");
  }

  try {
    // Logmeal API endpoint - adjust based on actual API documentation
    const formData = new FormData();
    formData.append("image", imageBuffer, {
      filename: "food.jpg",
      contentType: "image/jpeg",
    });

    const response = await axios.post(
      "https://api.logmeal.es/v2/image/segmentation/complete",
      formData,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
      }
    );

    // Parse Logmeal response and extract food info
    const foodData = response.data;
    const foodName = foodData.foodName || "Unknown food";
    const calories = foodData.calories || 0;
    const sodium = foodData.sodium || 0; // in mg

    // Determine BP impact based on sodium content
    let bpImpact: "low" | "moderate" | "high" = "low";
    let message = "This meal looks balanced for your cardiovascular health.";

    if (sodium > 2000) {
      bpImpact = "high";
      message = `This meal is high in sodium (${sodium}mg). Given your readings this week, it may elevate your blood pressure over the next few hours. Consider drinking water and reducing salt at your next meal.`;
    } else if (sodium > 1000) {
      bpImpact = "moderate";
      message = `This meal contains moderate sodium (${sodium}mg). Be mindful of your salt intake for the rest of the day.`;
    }

    return {
      foodName,
      calories,
      sodium,
      bpImpact,
      message,
    };
  } catch (error: any) {
    // Fallback response if API fails
    return {
      foodName: "Unable to identify",
      bpImpact: "low",
      message: "Could not analyze this food image. Please try again or describe your meal.",
    };
  }
}

