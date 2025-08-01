/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Database schema definition using Drizzle ORM
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
  user,
  session,
}

export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect

export type NewUser = typeof user.$inferInsert
export type NewSession = typeof session.$inferInsert
