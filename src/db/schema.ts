/**
 * Database schema definition using Drizzle ORM
 */
import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Count table schema definition
 */
export const count = sqliteTable('count', {
  id: text('id').primaryKey(),
  count: integer('count').notNull().default(0),
});

/**
 * User table schema definition
 */
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

/**
 * Session table schema definition
 */
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: text('expiresAt').notNull(),  // Store as ISO string
  signedIn: integer('signedIn', { mode: 'boolean' }).notNull(),
  token: text('token').notNull(),
  attemptCount: integer('attemptCount').notNull().default(0),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

// Define schema object for export
export const schema = {
  count,
  user,
  session,
};

export type Count = typeof count.$inferSelect;
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;

export type NewCount = typeof count.$inferInsert;
export type NewUser = typeof user.$inferInsert;
export type NewSession = typeof session.$inferInsert;
