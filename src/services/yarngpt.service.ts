import axios from "axios";
import { selectVoice } from "../utils/voice-selector";

/**
 * Convert text to speech using YarnGPT TTS API
 */
export async function textToSpeech(
  text: string,
  language: string
): Promise<Buffer> {
  const voice = selectVoice(language);
  const apiKey = process.env.YARNGPT_API_KEY;

  if (!apiKey) {
    throw new Error("YARNGPT_API_KEY is not configured");
  }

  try {
    const response = await axios.post(
      "https://yarngpt.ai/api/v1/tts",
      {
        text: text.substring(0, 2000), // Max 2000 characters
        voice: voice,
        response_format: "mp3",
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(response.data);
  } catch (error: any) {
    throw new Error(`YarnGPT TTS failed: ${error.message}`);
  }
}

