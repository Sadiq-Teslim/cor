import { Routes, Route, Navigate } from 'react-router-dom';
import { WelcomePage } from '@pages/welcome';
import { LanguageSelectPage } from '@pages/language-select';
import { OnboardingPage } from '@pages/onboarding';
import { MedicalRecordsPage } from '@pages/medical-records';
import { FirstReadingPage } from '@pages/first-reading';
import { HomePage } from '@pages/home';
import { BPCheckPage } from '@pages/bp-check';
import { FoodLoggerPage } from '@pages/food-logger';
import { MedicationTrackerPage } from '@pages/medication-tracker';
import { LifestyleInsightsPage } from '@pages/lifestyle-insights';
import { TrendHistoryPage } from '@pages/trend-history';
import { SettingsPage } from '@pages/settings';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/language" element={<LanguageSelectPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/medical-records" element={<MedicalRecordsPage />} />
      <Route path="/first-reading" element={<FirstReadingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/bp-check" element={<BPCheckPage />} />
      <Route path="/food-logger" element={<FoodLoggerPage />} />
      <Route path="/medications" element={<MedicationTrackerPage />} />
      <Route path="/lifestyle" element={<LifestyleInsightsPage />} />
      <Route path="/trends" element={<TrendHistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

