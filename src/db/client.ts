/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Database client module using Drizzle ORM
 */
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

/**
 * Create a Drizzle ORM client instance for the D1 database
 * @param db - The D1 database instance from Cloudflare env
 * @returns A Drizzle ORM client instance
 */
export const createDbClient = (db: D1Database) => {
  return drizzle(db, { schema })
}
