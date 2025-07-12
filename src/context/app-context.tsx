
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { UserProfile, WeightEntry, GlucoseLog, MealType, AuthState, AppUser } from '@/lib/types';
import { subDays, formatISO } from 'date-fns';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';


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
  addGlucoseLog: (log: Omit<GlucoseLog, 'id' | 'timestamp'> & { timestamp?: string }) => Promise<void>;
  updateGlucoseLog: (log: GlucoseLog) => Promise<void>;
  deleteGlucoseLog: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseLog[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setProfile({ ...docSnap.data(), email: firebaseUser.email! } as UserProfile);
        } else {
            const newProfile: UserProfile = {
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email!,
                birthdate: '',
                height: 0,
            };
            await setDoc(userRef, {name: newProfile.name, height: newProfile.height, birthdate: newProfile.birthdate});
            setProfile(newProfile);
        }
        setAuthState('loggedIn');
      } else {
        setUser(null);
        setProfile(null);
        setAuthState('loggedOut');
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, name: string) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateFirebaseProfile(userCredential.user, { displayName: name });
      const userRef = doc(db, "users", userCredential.user.uid);
      const newProfile: Omit<UserProfile, 'email'> = {
          name: name,
          birthdate: '',
          height: 0,
      };
      await setDoc(userRef, newProfile);
      setProfile({ ...newProfile, email: userCredential.user.email! });
      setUser(userCredential.user);
      setAuthState('loggedIn');
  };

  const login = async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
      await signOut(auth);
  };
  
  const updateProfileData = async (newProfileData: Partial<UserProfile>) => {
    if (!user) throw new Error("User not authenticated.");
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, newProfileData);
    setProfile(p => p ? { ...p, ...newProfileData } : null);
  };
  
  const fetchWeightHistory = async (userId: string) => {
    const q = query(collection(db, `users/${userId}/weightHistory`), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightEntry));
    setWeightHistory(history);
  };

  const addWeightEntry = async (weight: number) => {
    if (!user) throw new Error("User not authenticated.");
    const newEntry = { weight, date: formatISO(new Date()) };
    const docRef = await addDoc(collection(db, `users/${user.uid}/weightHistory`), newEntry);
    setWeightHistory(prev => [{ id: docRef.id, ...newEntry }, ...prev]);
  };
  
  const fetchGlucoseLogs = async (userId: string) => {
    const q = query(collection(db, `users/${userId}/glucoseLogs`), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlucoseLog));
    setGlucoseLogs(logs);
  };

  const addGlucoseLog = async (log: Omit<GlucoseLog, 'id' | 'timestamp'> & { timestamp?: string }) => {
    if (!user) throw new Error("User not authenticated.");
    const newLog = {
      ...log,
      timestamp: log.timestamp || formatISO(new Date()),
    };
    const docRef = await addDoc(collection(db, `users/${user.uid}/glucoseLogs`), newLog);
    setGlucoseLogs(prev => [{ id: docRef.id, ...newLog }, ...prev]);
  };
  
  const updateGlucoseLog = async (updatedLog: GlucoseLog) => {
    if (!user) throw new Error("User not authenticated.");
    const logRef = doc(db, `users/${user.uid}/glucoseLogs`, updatedLog.id);
    await updateDoc(logRef, updatedLog);
    setGlucoseLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
  };
  
  const deleteGlucoseLog = async (id: string) => {
    if (!user) throw new Error("User not authenticated.");
    await deleteDoc(doc(db, `users/${user.uid}/glucoseLogs`, id));
    setGlucoseLogs(prev => prev.filter(log => log.id !== id));
  };

  useEffect(() => {
    if (authState === 'loggedIn' && user) {
        fetchWeightHistory(user.uid);
        fetchGlucoseLogs(user.uid);
    } else {
        setWeightHistory([]);
        setGlucoseLogs([]);
    }
  }, [authState, user]);
  
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
    addGlucoseLog,
    updateGlucoseLog,
    deleteGlucoseLog,
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
