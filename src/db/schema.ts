/**
 * Database schema definition using Drizzle ORM
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Count table schema definition
 */
export const count = sqliteTable('count', {
  id: text('id').primaryKey(),
  count: integer('count').notNull().default(0),
});
