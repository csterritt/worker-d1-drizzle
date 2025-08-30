/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Type declaration for Cloudflare binding
 */
import { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './db/schema'

declare interface Bindings {
  /**
   * D1 database binding
   */
  PROJECT_DB: D1Database
}

/**
 * Add types to Hono Context for db client
 */
declare module 'hono' {
  interface ContextVariableMap {
    db: DrizzleD1Database<typeof schema>
  }
}
