// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// User types
export interface User {
  id: string;
  name: string;
  age: number;
  biologicalSex: 'male' | 'female' | 'other';
  preferredLanguage: string;
  hasHypertension: boolean;
  medications: string[];
  smokes: boolean;
  drinksAlcohol: boolean;
  activityLevel: 'low' | 'moderate' | 'high';
  averageSleepHours: number;
  familyHistoryHeartDisease: boolean;
  smartwatchConnected: boolean;
  smartwatchType?: string;
  createdAt: string;
  updatedAt: string;
}

// Health reading types
export interface DailyReading {
  date: string;
  hrv: number;
  heartRate?: number;
  sedentaryHours: number;
  sleepQuality: number;
  screenStressIndex?: number;
  foodImpact?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  bpCategory?: string;
  bpRisk?: 'low' | 'moderate' | 'high';
}

export interface Baseline {
  hrv: number;
  sedentaryHours: number;
  sleepQuality: number;
  screenStressIndex?: number;
}

export interface CSSResult {
  score: number;
  trend: 'improving' | 'stable' | 'worsening';
  worseningDays: number;
  shouldAlert: boolean;
}

export interface HealthContext {
  css: number;
  trend: 'improving' | 'stable' | 'worsening';
  hrv: number;
  hrvBaseline: number;
  hrvDelta: number;
  sedentaryHours: number;
  sleepQuality: number;
  worseningDays: number;
  screenStressIndex?: number;
}

// BP Reading
export interface BPReading {
  systolic: number;
  diastolic: number;
  confidence: 'low' | 'medium' | 'high';
  category: string;
  risk: 'low' | 'moderate' | 'high';
  recommendation?: string;
}

// Medication
export interface Medication {
  id: string;
  userId: string;
  name: string;
  affectsBP: boolean;
  dailyReminder: boolean;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

// Food log
export interface FoodLog {
  id: string;
  userId: string;
  date: string;
  foodName: string;
  calories?: number;
  sodium?: number;
  bpImpact: 'low' | 'moderate' | 'high';
  method: 'camera' | 'voice';
  imageUrl?: string;
  createdAt: string;
}

// Medical record
export interface MedicalRecord {
  id: string;
  userId: string;
  fileName: string;
  extractedData?: {
    diagnoses?: string[];
    medications?: string[];
    labResults?: Record<string, any>;
    bpReadings?: Array<{ systolic: number; diastolic: number; date: string }>;
  };
  uploadedAt: string;
}

// Onboarding
export interface OnboardingData {
  name: string;
  age: number;
  biologicalSex: 'male' | 'female' | 'other';
  preferredLanguage: string;
  hasHypertension: boolean;
  medications?: string[];
  smokes: boolean;
  drinksAlcohol: boolean;
  activityLevel: 'low' | 'moderate' | 'high';
  averageSleepHours: number;
  familyHistoryHeartDisease: boolean;
  smartwatchConnected?: boolean;
  smartwatchType?: string;
  answers?: Record<string, any>;
}

// Home screen data
export interface HomeData {
  healthPulse: string;
  hasMedicationReminder: boolean;
  medicationReminders: Array<{ name: string; time?: string }>;
  recentActivity: string;
  css: { score: number; trend: 'improving' | 'stable' | 'worsening' };
  lastReading?: {
    date: string;
    hrv: number;
    heartRate?: number;
  };
  todayTip?: string;
}

// Lifestyle insights
export interface LifestyleInsights {
  summary: string;
  recommendation: string;
  weekStats: {
    sleepDisruptedNights: number;
    averageSedentaryHours: number;
    highSodiumMeals: number;
    averageCSS: number;
  };
}

// Trend data
export interface TrendData {
  date: string;
  css: number;
  hrv: number;
  sedentaryHours: number;
  sleepQuality: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface TrendsResponse {
  trends: TrendData[];
  baseline: Baseline;
  summary: {
    bestDay: TrendData;
    worstDay: TrendData;
    averageCSS: number;
  };
}

