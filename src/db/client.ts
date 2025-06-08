/**
 * Database client module using Drizzle ORM
 */
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Create a Drizzle ORM client instance for the D1 database
 * @param db - The D1 database instance from Cloudflare env
 * @returns A Drizzle ORM client instance
 */
export function createDbClient(db: D1Database) {
  return drizzle(db, { schema });
}
