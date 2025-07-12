
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
  id: string;
  name: string;
  birthdate: string | null; // ISO string or null
  height: number | null; // in cm or null
  email: string;
}

export type AuthState = 'loading' | 'loggedIn' | 'loggedOut';

export interface AppUser {
    id: string;
    email: string;
    displayName: string;
}
