
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { UserProfile, WeightEntry, GlucoseLog, MealType, AuthState, AppUser } from '@/lib/types';
import { formatISO } from 'date-fns';
import * as db from '@/app/db-actions';

interface AppContextType {
  authState: AuthState;
  user: AppUser | null;
  profile: UserProfile | null;
  weightHistory: WeightEntry[];
  glucoseLogs: GlucoseLog[];
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<Omit<UserProfile, 'id' | 'email'>>) => Promise<void>;
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

  const logout = useCallback(async () => {
    try {
      await db.logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
    finally {
      setUser(null);
      setProfile(null);
      setWeightHistory([]);
      setGlucoseLogs([]);
      setAuthState('loggedOut');
    }
  }, []);

  const loadInitialData = useCallback(async (appUser: AppUser) => {
    setUser(appUser);
    try {
      const [userProfile, userWeightHistory, userGlucoseLogs] = await Promise.all([
        db.getUserProfile(appUser.id),
        db.getWeightHistory(appUser.id),
        db.getGlucoseLogs(appUser.id),
      ]);

      if (userProfile) {
        setProfile(userProfile);
        setWeightHistory(userWeightHistory);
        setGlucoseLogs(userGlucoseLogs);
        setAuthState('loggedIn');
      } else {
        await logout();
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      await logout();
    }
  }, [logout]);

  useEffect(() => {
    const checkUserSession = async () => {
        try {
            const sessionUser = await db.checkSession();
            if (sessionUser) {
                await loadInitialData(sessionUser);
            } else {
                setAuthState('loggedOut');
            }
        } catch (error) {
            console.error("Session check failed:", error);
            setAuthState('loggedOut');
        }
    };
    if (authState === 'loading') {
      checkUserSession();
    }
  }, [loadInitialData, authState]);


  const signup = async (email: string, password: string, name: string) => {
    setAuthState('loading');
    const newUser = await db.signup(email, password, name);
    await loadInitialData(newUser);
  };

  const login = async (email: string, password: string) => {
    setAuthState('loading');
    const loggedInUser = await db.login(email, password);
    await loadInitialData(loggedInUser);
  };

  const updateProfile = async (newProfileData: Partial<UserProfile>) => {
    if (!user) throw new Error("User not authenticated.");
    const updatedProfile = await db.updateUserProfile(user.id, newProfileData);
    if(updatedProfile) {
        setProfile(updatedProfile);
    }
  };
  
  const addWeightEntry = async (weight: number) => {
    if (!user) throw new Error("User not authenticated.");
    const newEntry: Omit<WeightEntry, 'id'> = { weight, date: formatISO(new Date()) };
    const entry = await db.addWeightEntry(user.id, newEntry);
    setWeightHistory(prev => [entry, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const updateWeightEntry = async (updatedEntry: WeightEntry) => {
    if (!user) throw new Error("User not authenticated.");
    const entry = await db.updateWeightEntry(updatedEntry);
    setWeightHistory(prev => prev.map(e => e.id === entry.id ? entry : e).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteWeightEntry = async (id: string) => {
    if (!user) throw new Error("User not authenticated.");
    await db.deleteWeightEntry(id);
    setWeightHistory(prev => prev.filter(entry => entry.id !== id));
  };

  const deleteMultipleWeightEntries = async (ids: string[]) => {
    if (!user) throw new Error("User not authenticated.");
    await db.deleteMultipleWeightEntries(ids);
    const idSet = new Set(ids);
    setWeightHistory(prev => prev.filter(entry => !idSet.has(entry.id)));
  };
  
  const addGlucoseLog = async (log: Omit<GlucoseLog, 'id' | 'timestamp'> & { timestamp?: string }) => {
    if (!user) throw new Error("User not authenticated.");
    const newLogData = {
      ...log,
      timestamp: log.timestamp || formatISO(new Date()),
    };
    const newLog = await db.addGlucoseLog(user.id, newLogData);
    
    setGlucoseLogs(prev => [newLog, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };
  
  const updateGlucoseLog = async (updatedLog: GlucoseLog) => {
    if (!user) throw new Error("User not authenticated.");
    const newLog = await db.updateGlucoseLog(updatedLog);
    setGlucoseLogs(prev => prev.map(log => log.id === newLog.id ? newLog : log).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };
  
  const deleteGlucoseLog = async (id: string) => {
    if (!user) throw new Error("User not authenticated.");
    await db.deleteGlucoseLog(id);
    setGlucoseLogs(prev => prev.filter(log => log.id !== id));
  };

  const deleteMultipleGlucoseLogs = async (ids: string[]) => {
    if (!user) throw new Error("User not authenticated.");
    await db.deleteMultipleGlucoseLogs(ids);
    const idSet = new Set(ids);
    setGlucoseLogs(prev => prev.filter(log => !idSet.has(log.id)));
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
    updateProfile,
    addWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
    deleteMultipleWeightEntries,
    addGlucoseLog,
    updateGlucoseLog,
    deleteGlucoseLog,
    deleteMultipleGlucoseLogs,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [profile, weightHistory, glucoseLogs, authState, user, logout, loadInitialData]);

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
