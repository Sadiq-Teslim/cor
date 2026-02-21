import { User, DailyReading, Baseline, MedicalRecord } from "../types";

/**
 * In-memory data store for demo/hackathon
 * In production, replace with proper database (PostgreSQL, MongoDB, etc.)
 */
class DataStore {
  private users: Map<string, User> = new Map();
  private readings: Map<string, DailyReading[]> = new Map(); // userId -> readings[]
  private baselines: Map<string, Baseline> = new Map(); // userId -> baseline
  private medicalRecords: Map<string, MedicalRecord[]> = new Map(); // userId -> records[]
  private hasAlertedToday: Map<string, boolean> = new Map(); // userId -> boolean

  // User operations
  createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): User {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const updated = {
      ...user,
      ...updates,
      id: userId, // Prevent ID changes
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userId, updated);
    return updated;
  }

  // Reading operations
  addReading(userId: string, reading: DailyReading): void {
    const userReadings = this.readings.get(userId) || [];
    userReadings.push(reading);
    // Keep only last 30 days
    const recent = userReadings.slice(-30);
    this.readings.set(userId, recent);
  }

  getReadings(userId: string, days?: number): DailyReading[] {
    const allReadings = this.readings.get(userId) || [];
    if (days) {
      return allReadings.slice(-days);
    }
    return allReadings;
  }

  // Baseline operations
  setBaseline(userId: string, baseline: Baseline): void {
    this.baselines.set(userId, baseline);
  }

  getBaseline(userId: string): Baseline | undefined {
    return this.baselines.get(userId);
  }

  // Medical records
  addMedicalRecord(userId: string, record: MedicalRecord): void {
    const records = this.medicalRecords.get(userId) || [];
    records.push(record);
    this.medicalRecords.set(userId, records);
  }

  getMedicalRecords(userId: string): MedicalRecord[] {
    return this.medicalRecords.get(userId) || [];
  }

  // Alert tracking
  setHasAlertedToday(userId: string, value: boolean): void {
    this.hasAlertedToday.set(userId, value);
  }

  getHasAlertedToday(userId: string): boolean {
    return this.hasAlertedToday.get(userId) || false;
  }

  // Reset daily alert flag (call this at midnight or on new day)
  resetDailyFlags(): void {
    this.hasAlertedToday.clear();
  }
}

// Singleton instance
export const dataStore = new DataStore();

