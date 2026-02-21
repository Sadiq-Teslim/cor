/**
 * Maps Whisper-detected language codes to YarnGPT voices
 * All voices are Nigerian — optimized for African languages
 */
export function selectVoice(language: string): string {
  const voiceMap: Record<string, string> = {
    yo: "Wura", // Yoruba → young, sweet
    pcm: "Jude", // Nigerian Pidgin → warm, confident
    ha: "Zainab", // Hausa → soothing, gentle
    ig: "Chinonye", // Igbo → engaging, warm
    en: "Femi", // English → rich, reassuring
    fr: "Idera", // French → melodic, gentle (default for French)
  };

  return voiceMap[language.toLowerCase()] || "Idera"; // Idera is the safe default
}

/**
 * Available YarnGPT voices for reference:
 * Idera — Melodic, gentle (default)
 * Emma — Authoritative, deep
 * Zainab — Soothing, gentle
 * Osagie — Smooth, calm
 * Wura — Young, sweet
 * Jude — Warm, confident
 * Chinonye — Engaging, warm
 * Tayo — Upbeat, energetic
 * Regina — Mature, warm
 * Femi — Rich, reassuring
 * Adaora — Warm, engaging
 * Umar — Calm, smooth
 * Mary — Energetic, youthful
 * Nonso — Bold, resonant
 * Romi — Melodious, warm
 * Adam — Deep, clear
 */

