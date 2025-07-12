
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { UserProfile, WeightEntry, GlucoseLog, MealType, AuthState, AppUser } from '@/lib/types';
import { subDays, formatISO } from 'date-fns';

// In-memory data store
let users: (UserProfile & { password?: string })[] = [];
let weightHistoryStore: { [userId: string]: WeightEntry[] } = {};
let glucoseLogsStore: { [userId: string]: GlucoseLog[] } = {};

const createInitialData = (userId: string) => {
    if (!glucoseLogsStore[userId] || glucoseLogsStore[userId].length === 0) {
        glucoseLogsStore[userId] = Array.from({ length: 30 }, (_, i) => ({
            id: `log${i}`,
            timestamp: formatISO(subDays(new Date(), i)),
            mealType: (['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Fasting'] as MealType[])[i % 5],
            glycemia: parseFloat((Math.random() * (2.5 - 0.7) + 0.7).toFixed(2)),
            dosage: Math.floor(Math.random() * 10),
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    if (!weightHistoryStore[userId] || weightHistoryStore[userId].length === 0) {
        weightHistoryStore[userId] = Array.from({ length: 4 }, (_, i) => ({
            id: `weight${i}`,
            date: formatISO(subDays(new Date(), i * 7)),
            weight: parseFloat((Math.random() * (85 - 75) + 75).toFixed(1)),
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
};

interface AppContextType {
  authState: AuthState;
  user: AppUser | null;
  profile: UserProfile | null;
  weightHistory: WeightEntry[];
  glucoseLogs: GlucoseLog[];
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addWeightEntry: (weight: number) => Promise<void>;
  updateWeightEntry: (entry: WeightEntry) => Promise<void>;
  deleteWeightEntry: (id: string) => Promise<void>;
  deleteMultipleWeightEntries: (ids: string[]) => Promise<void>;
  addGlucoseLog: (log: Omit<GlucoseLog, 'id' | 'timestamp'> & { timestamp?: string }) => Promise<void>;
  updateGlucoseLog: (log: GlucoseLog) => Promise<void>;
  deleteGlucoseLog: (id: string) => Promise<void>;
  deleteMultipleGlucoseLogs: (ids: string[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseLog[]>([]);

  useEffect(() => {
    // Simulate checking auth state on load
    const loggedInUserEmail = localStorage.getItem('loggedInUser');
    if (loggedInUserEmail) {
      const foundUser = users.find(u => u.email === loggedInUserEmail);
      if (foundUser) {
        const appUser = { id: foundUser.id, email: foundUser.email, displayName: foundUser.name };
        setUser(appUser);
        setProfile(foundUser);
        setAuthState('loggedIn');
        
        createInitialData(foundUser.id);
        setWeightHistory(weightHistoryStore[foundUser.id] || []);
        setGlucoseLogs(glucoseLogsStore[foundUser.id] || []);

      } else {
        setAuthState('loggedOut');
      }
    } else {
      setAuthState('loggedOut');
    }
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    if (users.some(u => u.email === email)) {
      throw new Error("An account with this email already exists.");
    }
    const id = `user_${Date.now()}`;
    const newUser: UserProfile & {password: string} = {
      id,
      name,
      email,
      password,
      birthdate: '',
      height: 0,
    };
    users.push(newUser);
    
    const appUser = { id: newUser.id, email: newUser.email, displayName: newUser.name };
    setUser(appUser);
    setProfile(newUser);
    setAuthState('loggedIn');
    localStorage.setItem('loggedInUser', email);
    
    createInitialData(id);
    setWeightHistory(weightHistoryStore[id] || []);
    setGlucoseLogs(glucoseLogsStore[id] || []);
  };

  const login = async (email: string, password: string) => {
    const foundUser = users.find(u => u.email === email);
    if (!foundUser || foundUser.password !== password) {
      throw new Error("Invalid email or password.");
    }

    const appUser = { id: foundUser.id, email: foundUser.email, displayName: foundUser.name };
    setUser(appUser);
    setProfile(foundUser);
    setAuthState('loggedIn');
    localStorage.setItem('loggedInUser', email);

    createInitialData(foundUser.id);
    setWeightHistory(weightHistoryStore[foundUser.id] || []);
    setGlucoseLogs(glucoseLogsStore[foundUser.id] || []);
  };

  const logout = async () => {
    setUser(null);
    setProfile(null);
    setWeightHistory([]);
    setGlucoseLogs([]);
    setAuthState('loggedOut');
    localStorage.removeItem('loggedInUser');
  };
  
  const updateProfileData = async (newProfileData: Partial<UserProfile>) => {
    if (!user) throw new Error("User not authenticated.");
    users = users.map(u => u.id === user.id ? { ...u, ...newProfileData } : u);
    setProfile(p => p ? { ...p, ...newProfileData } : null);
  };
  
  const addWeightEntry = async (weight: number) => {
    if (!user) throw new Error("User not authenticated.");
    const newEntry: WeightEntry = { id: `weight_${Date.now()}`, weight, date: formatISO(new Date()) };
    const sortedHistory = [newEntry, ...(weightHistoryStore[user.id] || [])]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    weightHistoryStore[user.id] = sortedHistory;
    setWeightHistory(sortedHistory);
  };

  const updateWeightEntry = async (updatedEntry: WeightEntry) => {
    if (!user) throw new Error("User not authenticated.");
    const sortedHistory = (weightHistoryStore[user.id] || [])
      .map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    weightHistoryStore[user.id] = sortedHistory;
    setWeightHistory(sortedHistory);
  };

  const deleteWeightEntry = async (id: string) => {
    if (!user) throw new Error("User not authenticated.");
    const sortedHistory = (weightHistoryStore[user.id] || [])
      .filter(entry => entry.id !== id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    weightHistoryStore[user.id] = sortedHistory;
    setWeightHistory(sortedHistory);
  };

  const deleteMultipleWeightEntries = async (ids: string[]) => {
    if (!user) throw new Error("User not authenticated.");
    const idSet = new Set(ids);
    const sortedHistory = (weightHistoryStore[user.id] || [])
      .filter(entry => !idSet.has(entry.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    weightHistoryStore[user.id] = sortedHistory;
    setWeightHistory(sortedHistory);
  };
  
  const addGlucoseLog = async (log: Omit<GlucoseLog, 'id' | 'timestamp'> & { timestamp?: string }) => {
    if (!user) throw new Error("User not authenticated.");
    const newLog: GlucoseLog = {
      id: `gl_${Date.now()}`,
      ...log,
      timestamp: log.timestamp || formatISO(new Date()),
    };
    const sortedLogs = [newLog, ...(glucoseLogsStore[user.id] || [])]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    glucoseLogsStore[user.id] = sortedLogs;
    setGlucoseLogs(sortedLogs);
  };
  
  const updateGlucoseLog = async (updatedLog: GlucoseLog) => {
    if (!user) throw new Error("User not authenticated.");
    const sortedLogs = (glucoseLogsStore[user.id] || [])
        .map(log => log.id === updatedLog.id ? updatedLog : log)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    glucoseLogsStore[user.id] = sortedLogs;
    setGlucoseLogs(sortedLogs);
  };
  
  const deleteGlucoseLog = async (id: string) => {
    if (!user) throw new Error("User not authenticated.");
    const sortedLogs = (glucoseLogsStore[user.id] || [])
        .filter(log => log.id !== id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    glucoseLogsStore[user.id] = sortedLogs;
    setGlucoseLogs(sortedLogs);
  };

  const deleteMultipleGlucoseLogs = async (ids: string[]) => {
    if (!user) throw new Error("User not authenticated.");
    const idSet = new Set(ids);
    const sortedLogs = (glucoseLogsStore[user.id] || [])
        .filter(log => !idSet.has(log.id))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    glucoseLogsStore[user.id] = sortedLogs;
    setGlucoseLogs(sortedLogs);
  };

  const contextValue = useMemo(() => ({
    authState,
    user,
    profile,
    weightHistory,
    glucoseLogs,
    signup,
    login,
    logout,
    updateProfile: updateProfileData,
    addWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    deleteMultipleWeightEntries,
    addGlucoseLog,
    updateGlucoseLog,
    deleteGlucoseLog,
    deleteMultipleGlucoseLogs,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [profile, weightHistory, glucoseLogs, authState, user]);

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
