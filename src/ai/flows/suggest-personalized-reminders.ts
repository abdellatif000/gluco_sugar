// src/ai/flows/suggest-personalized-reminders.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow that analyzes historical glucose logs and suggests personalized reminders for checking blood sugar levels.
 *
 * - suggestPersonalizedReminders - A function that takes user's glucose logs as input and returns personalized reminders.
 * - SuggestPersonalizedRemindersInput - The input type for the suggestPersonalizedReminders function.
 * - SuggestPersonalizedRemindersOutput - The return type for the suggestPersonalizedReminders function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPersonalizedRemindersInputSchema = z.object({
  glucoseLogs: z.array(
    z.object({
      timestamp: z.string().describe('Date and time of the glucose reading (ISO format).'),
      mealType: z
        .enum(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Fasting'])
        .describe('Type of meal associated with the reading.'),
      glycemia: z.number().describe('Glucose level in g/L.'),
      dosage: z.number().describe('Novorapide dosage in units.'),
    })
  ).describe('Historical glucose log entries for the user.'),
});
export type SuggestPersonalizedRemindersInput = z.infer<typeof SuggestPersonalizedRemindersInputSchema>;

const SuggestPersonalizedRemindersOutputSchema = z.object({
  reminders: z.array(
    z.object({
      time: z.string().describe('Suggested time for the reminder (HH:mm).'),
      message: z.string().describe('Personalized reminder message.'),
    })
  ).describe('A list of personalized reminders for the user.'),
});
export type SuggestPersonalizedRemindersOutput = z.infer<typeof SuggestPersonalizedRemindersOutputSchema>;

export async function suggestPersonalizedReminders(input: SuggestPersonalizedRemindersInput): Promise<SuggestPersonalizedRemindersOutput> {
  return suggestPersonalizedRemindersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPersonalizedRemindersPrompt',
  input: {schema: SuggestPersonalizedRemindersInputSchema},
  output: {schema: SuggestPersonalizedRemindersOutputSchema},
  prompt: `You are an AI assistant specializing in diabetes management. Analyze the user's historical glucose logs and suggest personalized reminders for checking blood sugar levels. The reminders should be based on patterns in the user's glucose levels related to meal times, dosages, and glycemia levels. Suggest times to check glucose that will help them stabalize their glucose levels.

Glucose Logs:
{{#each glucoseLogs}}
- Timestamp: {{timestamp}}, Meal Type: {{mealType}}, Glycemia: {{glycemia}} g/L, Dosage: {{dosage}} units
{{/each}}

Based on this data, suggest personalized reminders including the time and reminder message:

Output in JSON format:
`,
});

const suggestPersonalizedRemindersFlow = ai.defineFlow(
  {
    name: 'suggestPersonalizedRemindersFlow',
    inputSchema: SuggestPersonalizedRemindersInputSchema,
    outputSchema: SuggestPersonalizedRemindersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
