import { DailyReading, Baseline, CSSResult } from "../types";

/**
 * Cardiovascular Stress Score (CSS) Engine
 * Calculates a 0-100 score based on multiple health signals
 * Never shown to user as raw number - used for alert triggers
 */
export function calculateCSS(
  readings: DailyReading[],
  baseline: Baseline
): CSSResult {
  if (readings.length === 0) {
    return {
      score: 0,
      trend: "stable",
      worseningDays: 0,
      shouldAlert: false,
      hrvDelta: 0,
    };
  }

  const latest = readings[readings.length - 1];

  // HRV component — 35% weight (updated from PRD)
  const hrvDelta = ((latest.hrv - baseline.hrv) / baseline.hrv) * 100;
  const hrvScore = Math.max(0, Math.min(100, 50 - hrvDelta));

  // Sedentary component — 25% weight
  const sedentaryScore = Math.min(100, (latest.sedentaryHours / 12) * 100);

  // Sleep component — 20% weight
  const sleepScore = Math.max(0, (1 - latest.sleepQuality / 10) * 100);

  // Food & medication component — 12% weight
  const foodScore = latest.foodImpact ? latest.foodImpact * 10 : 0;

  // Screen stress component — 8% weight
  const screenScore = latest.screenStressIndex
    ? latest.screenStressIndex * 10
    : 0;

  // Weighted composite score
  const score = Math.round(
    hrvScore * 0.35 +
      sedentaryScore * 0.25 +
      sleepScore * 0.2 +
      foodScore * 0.12 +
      screenScore * 0.08
  );

  // Trend: compare recent 3 days vs prior 3 days
  const recent = readings.slice(-3);
  const prior = readings.slice(-6, -3);
  let trend: CSSResult["trend"] = "stable";
  let worseningDays = 0;

  if (prior.length > 0 && recent.length > 0) {
    const recentAvg = recent.reduce((a, b) => a + b.hrv, 0) / recent.length;
    const priorAvg = prior.reduce((a, b) => a + b.hrv, 0) / prior.length;
    const change = ((recentAvg - priorAvg) / priorAvg) * 100;
    if (change < -5) trend = "worsening";
    else if (change > 5) trend = "improving";

    // Count consecutive worsening days
    for (let i = readings.length - 1; i > 0; i--) {
      if (readings[i].hrv < readings[i - 1].hrv) worseningDays++;
      else break;
    }
  }

  // Alert fires when score > 65 AND worsening for 5+ consecutive days (per PRD)
  const shouldAlert = score > 65 && worseningDays >= 5;

  return {
    score,
    trend,
    worseningDays,
    shouldAlert,
    hrvDelta: Math.round(hrvDelta),
  };
}

/**
 * Get health context for AI responses
 */
export function getHealthContext(
  readings: DailyReading[],
  baseline: Baseline | null
): Record<string, any> {
  if (!baseline || readings.length === 0) {
    return {
      css: 0,
      trend: "stable",
      hrv: 0,
      hrvBaseline: 0,
      hrvDelta: 0,
      sedentaryHours: 0,
      sleepQuality: 5,
      worseningDays: 0,
    };
  }

  const latest = readings[readings.length - 1];
  const css = calculateCSS(readings, baseline);

  return {
    css: css.score,
    trend: css.trend,
    hrv: latest.hrv,
    hrvBaseline: baseline.hrv,
    hrvDelta: css.hrvDelta,
    sedentaryHours: latest.sedentaryHours,
    sleepQuality: latest.sleepQuality,
    worseningDays: css.worseningDays,
    screenStressIndex: latest.screenStressIndex || 0,
  };
}

