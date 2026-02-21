import Groq from "groq-sdk";
import { FoodAnalysis } from "../types";

// Lazy Groq client (reuses the same pattern)
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Analyze food image using Groq Vision (Llama 3.2 Vision)
 * Identifies the food, estimates calories and sodium, and assesses BP impact
 */
export async function analyzeFood(imageBuffer: Buffer): Promise<FoodAnalysis> {
  try {
    const groq = getGroqClient();

    // Convert image buffer to base64
    const base64Image = imageBuffer.toString("base64");
    const mimeType = "image/jpeg";

    const response = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a food nutrition analysis expert. Analyze the food image and return ONLY a valid JSON object with the following fields:
{
  "foodName": "name of the food/meal identified",
  "calories": estimated calories (number),
  "sodium": estimated sodium in mg (number),
  "potassium": estimated potassium in mg (number),
  "fiber": estimated fiber in g (number),
  "bpImpact": "low" | "moderate" | "high" (based on sodium, saturated fat, and overall cardiovascular impact),
  "details": "brief 1-2 sentence description of the meal and its cardiovascular impact"
}

Guidelines for bpImpact:
- "high": sodium > 1500mg, or high saturated fat, processed/fried foods, heavy red meat
- "moderate": sodium 800-1500mg, mixed nutritional profile
- "low": sodium < 800mg, fruits, vegetables, lean protein, whole grains

Be specific about the food name. If you see Nigerian/African food, name it properly (e.g., "Jollof Rice with Fried Plantain", "Amala with Ewedu and Gbegiri", "Suya").
Return ONLY the JSON object, no other text.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: "Identify this food and analyze its nutritional content, especially sodium and cardiovascular impact.",
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || "{}";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    const sodium = parsed.sodium || 0;
    let bpImpact: "low" | "moderate" | "high" = parsed.bpImpact || "low";
    let message = "";

    if (bpImpact === "high" || sodium > 1500) {
      bpImpact = "high";
      message = `${parsed.foodName} is high in sodium (~${sodium}mg). This may elevate your blood pressure over the next few hours. Consider drinking water and reducing salt at your next meal.`;
    } else if (bpImpact === "moderate" || sodium > 800) {
      bpImpact = "moderate";
      message = `${parsed.foodName} has moderate sodium (~${sodium}mg). Be mindful of your salt intake for the rest of the day.`;
    } else {
      message = `${parsed.foodName} is a heart-friendly choice! Low sodium (~${sodium}mg) and good for your cardiovascular health.`;
    }

    if (parsed.details) {
      message += ` ${parsed.details}`;
    }

    return {
      foodName: parsed.foodName || "Unidentified food",
      calories: parsed.calories || 0,
      sodium,
      bpImpact,
      message,
    };
  } catch (error: any) {
    console.error("Food analysis error:", error.message);

    // If vision model fails, provide a helpful fallback
    if (error.message?.includes("model")) {
      // Try with smaller vision model
      try {
        return await analyzeFoodFallback(imageBuffer);
      } catch {
        // Final fallback
      }
    }

    return {
      foodName: "Unable to identify",
      bpImpact: "low",
      message:
        "Could not analyze this food image. Please try again with a clearer photo, or use voice to describe your meal.",
    };
  }
}

/**
 * Fallback: use smaller vision model
 */
async function analyzeFoodFallback(imageBuffer: Buffer): Promise<FoodAnalysis> {
  const groq = getGroqClient();
  const base64Image = imageBuffer.toString("base64");

  const response = await groq.chat.completions.create({
    model: "llama-3.2-11b-vision-preview",
    messages: [
      {
        role: "system",
        content: `Identify the food in this image. Return ONLY valid JSON: {"foodName":"name","calories":number,"sodium":number,"bpImpact":"low"|"moderate"|"high","details":"brief description"}`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
          {
            type: "text",
            text: "What food is this? Estimate nutritional values.",
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  const content = response.choices[0].message.content || "{}";
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);
  const sodium = parsed.sodium || 0;
  let bpImpact: "low" | "moderate" | "high" = parsed.bpImpact || "low";

  let message = parsed.details || "Food analyzed successfully.";
  if (sodium > 1500) {
    bpImpact = "high";
    message = `High sodium content (~${sodium}mg). Consider reducing salt intake.`;
  } else if (sodium > 800) {
    bpImpact = "moderate";
    message = `Moderate sodium (~${sodium}mg). Watch your salt for the rest of the day.`;
  }

  return {
    foodName: parsed.foodName || "Food item",
    calories: parsed.calories || 0,
    sodium,
    bpImpact,
    message,
  };
}
