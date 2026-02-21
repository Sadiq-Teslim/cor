import api from '../config/api';
import type {
  ApiResponse,
  User,
  DailyReading,
  Baseline,
  CSSResult,
  BPReading,
  Medication,
  MedicalRecord,
  OnboardingData,
  HomeData,
  LifestyleInsights,
  TrendsResponse,
} from './types';

// Health endpoints
export const healthApi = {
  getReadings: (userId: string, days?: number) =>
    api.get<ApiResponse<{ readings: DailyReading[] }>>(
      `/api/health/readings?userId=${userId}${days ? `&days=${days}` : ''}`
    ),
  
  addReading: (data: { userId: string } & Partial<DailyReading>) =>
    api.post<ApiResponse<{ reading: DailyReading; bpEstimate?: BPReading }>>(
      '/api/health/readings',
      data
    ),
  
  getBaseline: (userId: string) =>
    api.get<ApiResponse<Baseline>>(`/api/health/baseline?userId=${userId}`),
  
  setBaseline: (userId: string, baseline: Baseline) =>
    api.post<ApiResponse>('/api/health/baseline', { userId, baseline }),
  
  getCSS: (userId: string) =>
    api.get<ApiResponse<{ css: CSSResult; healthContext: any }>>(
      `/api/health/css?userId=${userId}`
    ),
  
  checkAlert: (userId: string) =>
    api.post<ApiResponse<{ shouldAlert: boolean; message?: string }>>(
      '/api/health/alert',
      { userId }
    ),
  
  getAlerts: (userId: string, days?: number) =>
    api.get<ApiResponse<{ alerts: any[] }>>(
      `/api/health/alerts?userId=${userId}${days ? `&days=${days}` : ''}`
    ),
  
  estimateBP: (userId: string, hrv: number) =>
    api.post<ApiResponse<BPReading>>('/api/health/bp-estimate', { userId, hrv }),
};

// User endpoints
export const userApi = {
  onboard: (data: OnboardingData) =>
    api.post<ApiResponse<{ user: User }>>('/api/users/onboard', data),
  
  getUser: (userId: string) =>
    api.get<ApiResponse<{ user: User }>>(`/api/users/${userId}`),
  
  updateUser: (userId: string, data: Partial<User>) =>
    api.put<ApiResponse<{ user: User }>>(`/api/users/${userId}`, data),
};

// Voice endpoints
export const voiceApi = {
  transcribe: (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    return api.post<ApiResponse<{ text: string; language: string }>>(
      '/api/voice/transcribe',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
  
  respond: (data: {
    transcript: string;
    language: string;
    healthContext: any;
    userId?: string;
  }) =>
    api.post<ApiResponse<{ text: string; language: string }>>(
      '/api/voice/respond',
      data
    ),
  
  speak: (text: string, language: string) =>
    api.post<ApiResponse<Blob>>(
      '/api/voice/speak',
      { text, language },
      { responseType: 'blob' }
    ),
};

// Food endpoints
export const foodApi = {
  analyze: (imageFile: File, userId: string) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('userId', userId);
    return api.post<ApiResponse<{
      foodName: string;
      calories: number;
      sodium: number;
      bpImpact: 'low' | 'moderate' | 'high';
      message: string;
    }>>('/api/food/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  logVoice: (userId: string, audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('userId', userId);
    return api.post<ApiResponse<{
      foodName: string;
      calories: number;
      sodium: number;
      bpImpact: 'low' | 'moderate' | 'high';
      message: string;
    }>>('/api/food/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Medication endpoints
export const medicationApi = {
  getMedications: (userId: string) =>
    api.get<ApiResponse<{ medications: Medication[] }>>(
      `/api/medications?userId=${userId}`
    ),
  
  addMedication: (data: {
    userId: string;
    name: string;
    affectsBP?: boolean;
    dailyReminder?: boolean;
    reminderTime?: string;
  }) =>
    api.post<ApiResponse<{ medication: Medication; message?: string }>>(
      '/api/medications',
      data
    ),
  
  updateMedication: (medicationId: string, data: Partial<Medication>) =>
    api.put<ApiResponse<{ medication: Medication }>>(
      `/api/medications/${medicationId}`,
      data
    ),
  
  deleteMedication: (medicationId: string) =>
    api.delete<ApiResponse>(`/api/medications/${medicationId}`),
  
  logMedication: (medicationId: string, userId: string) =>
    api.post<ApiResponse>(`/api/medications/${medicationId}/log`, { userId }),
  
  getLogs: (userId: string, days?: number) =>
    api.get<ApiResponse<{ logs: any[] }>>(
      `/api/medications/logs?userId=${userId}${days ? `&days=${days}` : ''}`
    ),
};

// Medical records endpoints
export const medicalApi = {
  upload: (file: File, userId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    return api.post<ApiResponse<{ record: MedicalRecord }>>(
      '/api/medical/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
  
  getRecords: (userId: string) =>
    api.get<ApiResponse<{ records: MedicalRecord[] }>>(
      `/api/medical/records?userId=${userId}`
    ),
};

// Home endpoints
export const homeApi = {
  getData: (userId: string) =>
    api.get<ApiResponse<HomeData>>(`/api/home/data?userId=${userId}`),
};

// BP Check endpoints
export const bpCheckApi = {
  check: (data: {
    userId: string;
    hrv: number;
    heartRate?: number;
    feelingNote?: string;
  }) =>
    api.post<ApiResponse<{
      reading: BPReading;
      context: {
        comparedToAverage: string;
        message: string;
        recommendation: string;
      };
      category: { category: string; risk: string };
    }>>('/api/bp-check', data),
};

// First reading endpoints
export const firstReadingApi = {
  create: (data: { userId: string; hrv: number; heartRate?: number }) =>
    api.post<ApiResponse<{
      message: string;
      hrvStatus: string;
      reading: { hrv: number; heartRate?: number; date: string };
      bpEstimate: BPReading;
    }>>('/api/first-reading', data),
};

// Lifestyle endpoints
export const lifestyleApi = {
  getInsights: (userId: string) =>
    api.get<ApiResponse<LifestyleInsights>>(
      `/api/lifestyle/insights?userId=${userId}`
    ),
};

// Trends endpoints
export const trendsApi = {
  getTrends: (userId: string, days?: number) =>
    api.get<ApiResponse<TrendsResponse>>(
      `/api/utility/trends?userId=${userId}${days ? `&days=${days}` : ''}`
    ),
};

// Tip endpoints
export const tipApi = {
  getToday: (userId: string) =>
    api.get<ApiResponse<{ tip: string; category: string; language: string }>>(
      `/api/tip/today?userId=${userId}`
    ),
};

// Settings endpoints
export const settingsApi = {
  get: (userId: string) =>
    api.get<ApiResponse<{
      language: string;
      wakeWordEnabled: boolean;
      smartwatchConnected: boolean;
      smartwatchType?: string;
      notificationsEnabled: boolean;
    }>>(`/api/settings/${userId}`),
  
  update: (userId: string, data: {
    language?: string;
    wakeWordEnabled?: boolean;
    notificationsEnabled?: boolean;
  }) =>
    api.put<ApiResponse<{ settings: any }>>(`/api/settings/${userId}`, data),
};

// Onboarding endpoints
export const onboardingApi = {
  saveAnswer: (data: {
    userId: string;
    questionKey: string;
    answer: any;
  }) =>
    api.post<ApiResponse>('/api/onboarding/answer', data),
  
  getAnswers: (userId: string) =>
    api.get<ApiResponse<{ answers: any[] }>>(
      `/api/onboarding/answers?userId=${userId}`
    ),
};

// Audio endpoints
export const audioApi = {
  getAudio: (category: string, language: string, filename: string) =>
    api.get<Blob>(`/api/audio/${category}/${language}/${filename}`, {
      responseType: 'blob',
    }),
};

// Utility endpoints
export const utilityApi = {
  extractSleep: (data: {
    transcript: string;
    language: string;
    userId?: string;
  }) =>
    api.post<ApiResponse<{ sleepQuality: number; extractedInfo: string }>>(
      '/api/utility/sleep/extract',
      data
    ),
  
  generateReport: (userId: string, days?: number) =>
    api.post<Blob>(
      `/api/utility/clinical-share`,
      { userId, days },
      { responseType: 'blob' }
    ),
};

