export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Fasting';

export interface GlucoseLog {
  id: string;
  timestamp: string; // ISO string
  mealType: MealType;
  glycemia: number; // in g/L
  dosage: number; // Novorapide units
}

export interface WeightEntry {
  id: string;
  date: string; // ISO string
  weight: number; // in kg
}

export interface UserProfile {
  name: string;
  birthdate: string; // ISO string
  height: number; // in cm
}
