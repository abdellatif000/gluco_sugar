
'use server';

import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import type { UserProfile, WeightEntry, GlucoseLog, AppUser } from '@/lib/types';
import { eq, inArray } from 'drizzle-orm';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'glucotrack_session';

// Check for database connection string
if (!process.env.POSTGRES_URL) {
  const errorMessage = "Database connection string is not configured. Please set POSTGRES_URL.";
  const handler = {
    get(target: any, prop: any) {
      if (typeof target[prop] === 'function') {
        return () => { throw new Error(errorMessage) };
      }
      return target[prop];
    },
  };
  module.exports = new Proxy({}, handler);
}


async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Mimic session management
async function createSession(userId: string) {
  cookies().set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

async function clearSession() {
    cookies().delete(SESSION_COOKIE_NAME);
}

export async function checkSession(): Promise<AppUser | null> {
    const userId = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!userId) return null;

    try {
        const user = await db.query.users.findFirst({
            where: eq(schema.users.id, userId),
        });
        if (!user) return null;
        return { id: user.id, email: user.email, displayName: user.name };
    } catch {
        return null;
    }
}


// User Actions
export async function signup(email: string, password: string, name: string): Promise<AppUser> {
  const existingUser = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }
  
  const passwordHash = await hashPassword(password);
  
  const newUser = await db.insert(schema.users).values({ id: `user_${Date.now()}`, name, email, passwordHash }).returning().then(res => res[0]);

  await createSession(newUser.id);
  
  return { id: newUser.id, email: newUser.email, displayName: newUser.name };
}

export async function login(email: string, password: string): Promise<AppUser> {
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password.");
  }
  
  await createSession(user.id);

  return { id: user.id, email: user.email, displayName: user.name };
}

export async function logout(): Promise<void> {
    await clearSession();
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    birthdate: user.birthdate ? user.birthdate.toISOString() : null,
    height: user.height,
  };
}

export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, 'id' | 'email'>>): Promise<UserProfile | null> {
    const updateData: Partial<typeof schema.users.$inferInsert> = {
        name: data.name,
        height: data.height,
        birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
    }

    const updatedUser = await db.update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, userId))
        .returning()
        .then(res => res[0]);

    if (!updatedUser) return null;
    
    return getUserProfile(userId);
}


// Weight History Actions
export async function getWeightHistory(userId: string): Promise<WeightEntry[]> {
  const entries = await db.query.weightHistory.findMany({
    where: eq(schema.weightHistory.userId, userId),
    orderBy: (entry, { desc }) => [desc(entry.date)],
  });

  return entries.map(e => ({ ...e, date: e.date.toISOString(), id: e.id as string }));
}

export async function addWeightEntry(userId: string, data: Omit<WeightEntry, 'id'>): Promise<WeightEntry> {
    const newEntry = await db.insert(schema.weightHistory).values({ id: `weight_${Date.now()}`, userId, ...data, date: new Date(data.date) }).returning().then(res => res[0]);
    return { ...newEntry, date: newEntry.date.toISOString(), id: newEntry.id as string };
}

export async function updateWeightEntry(entry: WeightEntry): Promise<WeightEntry> {
    const updatedEntry = await db.update(schema.weightHistory)
        .set({ weight: entry.weight, date: new Date(entry.date) })
        .where(eq(schema.weightHistory.id, entry.id))
        .returning().then(res => res[0]);
    return { ...updatedEntry, date: updatedEntry.date.toISOString(), id: updatedEntry.id as string };
}

export async function deleteWeightEntry(id: string): Promise<void> {
    await db.delete(schema.weightHistory).where(eq(schema.weightHistory.id, id));
}

export async function deleteMultipleWeightEntries(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(schema.weightHistory).where(inArray(schema.weightHistory.id, ids));
}


// Glucose Log Actions
export async function getGlucoseLogs(userId: string): Promise<GlucoseLog[]> {
    const logs = await db.query.glucoseLogs.findMany({
        where: eq(schema.glucoseLogs.userId, userId),
        orderBy: (log, { desc }) => [desc(log.timestamp)],
    });
    return logs.map(l => ({
        ...l,
        timestamp: l.timestamp.toISOString(),
        id: l.id,
    }));
}

export async function addGlucoseLog(userId: string, data: Omit<GlucoseLog, 'id'>): Promise<GlucoseLog> {
    const timestamp = new Date(data.timestamp);
    
    const newLog = await db.insert(schema.glucoseLogs)
        .values({ id: `gl_${Date.now()}`, userId, ...data, timestamp })
        .returning()
        .then(res => res[0]);

    return { ...newLog, timestamp: newLog.timestamp.toISOString() };
}

export async function updateGlucoseLog(log: GlucoseLog): Promise<GlucoseLog> {
    const updatedLog = await db.update(schema.glucoseLogs)
        .set({
            glycemia: log.glycemia,
            dosage: log.dosage,
            mealType: log.mealType,
            timestamp: new Date(log.timestamp),
        })
        .where(eq(schema.glucoseLogs.id, log.id))
        .returning().then(res => res[0]);
    return { ...updatedLog, timestamp: updatedLog.timestamp.toISOString() };
}

export async function deleteGlucoseLog(id: string): Promise<void> {
    await db.delete(schema.glucoseLogs).where(eq(schema.glucoseLogs.id, id));
}

export async function deleteMultipleGlucoseLogs(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(schema.glucoseLogs).where(inArray(schema.glucoseLogs.id, ids));
}
