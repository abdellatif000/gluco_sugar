
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { UserProfile, WeightEntry, GlucoseLog, MealType } from '@/lib/types';
import { subDays, formatISO } from 'date-fns';

interface AppContextType {
  profile: UserProfile;
  weightHistory: WeightEntry[];
  glucoseLogs: GlucoseLog[];
  updateProfile: (profile: Partial<UserProfile>) => void;
  addWeightEntry: (weight: number) => void;
  addGlucoseLog: (log: Omit<GlucoseLog, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  updateGlucoseLog: (log: GlucoseLog) => void;
  deleteGlucoseLog: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data generation functions
const generateMockLogs = (): GlucoseLog[] => {
  const logs: GlucoseLog[] = [];
  const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Fasting'];
  for (let i = 0; i < 30; i++) {
    const date = subDays(new Date(), i);
    for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
      const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8 + j * 5, Math.floor(Math.random() * 60));
      logs.push({
        id: `gl-${i}-${j}`,
        timestamp: formatISO(timestamp),
        mealType: mealTypes[Math.floor(Math.random() * mealTypes.length)],
        glycemia: parseFloat((Math.random() * 1.5 + 0.7).toFixed(2)),
        dosage: Math.floor(Math.random() * 10) + 1,
      });
    }
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateMockWeight = (): WeightEntry[] => {
  const weights: WeightEntry[] = [];
  for (let i = 0; i < 8; i++) {
    weights.push({
      id: `w-${i}`,
      date: formatISO(subDays(new Date(), i * 7)),
      weight: parseFloat((75 - Math.random() * 2).toFixed(1)),
    });
  }
  return weights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex Doe",
    birthdate: '1990-05-15',
    height: 175,
  });
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseLog[]>([]);

  useEffect(() => {
    setWeightHistory(generateMockWeight());
    setGlucoseLogs(generateMockLogs());
  }, []); // Empty dependency array ensures this runs once on mount, only on the client.

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile(p => ({ ...p, ...newProfile }));
  };

  const addWeightEntry = (weight: number) => {
    const newEntry: WeightEntry = {
      id: `w-${Date.now()}`,
      date: formatISO(new Date()),
      weight,
    };
    setWeightHistory(wh => [newEntry, ...wh].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const addGlucoseLog = (log: Omit<GlucoseLog, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const newLog: GlucoseLog = {
      ...log,
      id: `gl-${Date.now()}`,
      timestamp: log.timestamp || formatISO(new Date()),
    };
    setGlucoseLogs(gl => [newLog, ...gl].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const updateGlucoseLog = (updatedLog: GlucoseLog) => {
    setGlucoseLogs(gl => gl.map(log => (log.id === updatedLog.id ? updatedLog : log)));
  };

  const deleteGlucoseLog = (id: string) => {
    setGlucoseLogs(gl => gl.filter(log => log.id !== id));
  };

  const contextValue = useMemo(() => ({
    profile,
    weightHistory,
    glucoseLogs,
    updateProfile,
    addWeightEntry,
    addGlucoseLog,
    updateGlucoseLog,
    deleteGlucoseLog,
  }), [profile, weightHistory, glucoseLogs]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
