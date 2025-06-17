/**
 * Database schema definition using Drizzle ORM
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Count table schema definition
 */
export const count = sqliteTable('count', {
  id: text('id').primaryKey(),
  count: integer('count').notNull().default(0),
})

/**
 * User table schema definition
 */
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
})

/**
 * Session table schema definition
 */
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt').notNull(),
  signedIn: integer('signedIn', { mode: 'boolean' }).notNull(),
  token: text('token').notNull(),
  attemptCount: integer('attemptCount').notNull().default(0),
  createdAt: integer('createdAt').notNull(),
  updatedAt: integer('updatedAt').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

// Define schema object for export
export const schema = {
  count,
  user,
  session,
}

export type Count = typeof count.$inferSelect
export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect

export type NewCount = typeof count.$inferInsert
export type NewUser = typeof user.$inferInsert
export type NewSession = typeof session.$inferInsert
