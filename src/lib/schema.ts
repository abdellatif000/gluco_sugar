import { pgTable, text, timestamp, real, pgEnum, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const mealTypeEnum = pgEnum('meal_type', ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Fasting']);

export const users = pgTable('users', {
  id: text('id').notNull().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  birthdate: timestamp('birthdate'),
  height: real('height'), // in cm
});

export const glucoseLogs = pgTable('glucose_logs', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  glycemia: real('glycemia').notNull(), // in g/L
  dosage: real('dosage').notNull(), // Novorapide units
});

export const weightHistory = pgTable('weight_history', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  weight: real('weight').notNull(), // in kg
});

// Relations

export const usersRelations = relations(users, ({ many }) => ({
  glucoseLogs: many(glucoseLogs),
  weightHistory: many(weightHistory),
}));

export const glucoseLogsRelations = relations(glucoseLogs, ({ one }) => ({
  user: one(users, {
    fields: [glucoseLogs.userId],
    references: [users.id],
  }),
}));

export const weightHistoryRelations = relations(weightHistory, ({ one }) => ({
  user: one(users, {
    fields: [weightHistory.userId],
    references: [users.id],
  }),
}));
