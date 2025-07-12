'use server';

import { suggestPersonalizedReminders } from '@/ai/flows/suggest-personalized-reminders';
import type { GlucoseLog } from '@/lib/types';

export async function getSuggestedReminders(logs: GlucoseLog[]): Promise<{ time: string; message: string }[]> {
  try {
    const formattedLogs = logs.map(log => ({
      timestamp: log.timestamp,
      mealType: log.mealType,
      glycemia: log.glycemia,
      dosage: log.dosage,
    }));

    if (formattedLogs.length === 0) {
        return [{time: "Info", message: "Not enough data to generate reminders. Please add more glucose logs."}];
    }
    
    // a bit of defensive programming.
    const limitedLogs = formattedLogs.slice(0, 50);

    const result = await suggestPersonalizedReminders({ glucoseLogs: limitedLogs });
    return result.reminders;
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return [{time: "Error", message: "Could not generate reminders at this time. Please try again later."}];
  }
}
