/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Middleware to validate required environment bindings at runtime
 * @module middleware/validateEnvBindings
 */
import { Context, Next } from 'hono'

const INTERNAL_SERVER_ERROR = 500
import type { Bindings, AppVariables } from '../local-types'

/**
 * Required environment bindings that must be set for the app to function
 */
const REQUIRED_BINDINGS: (keyof Bindings)[] = [
  'BETTER_AUTH_SECRET',
  'SIGN_UP_MODE',
]

/**
 * Middleware that validates required environment bindings are present
 * Returns 500 error if critical bindings are missing
 */
export const validateEnvBindings = async (
  c: Context<{ Bindings: Bindings; Variables: AppVariables }>,
  next: Next
): Promise<Response | void> => {
  const missingBindings: string[] = []

  for (const binding of REQUIRED_BINDINGS) {
    const value = c.env[binding]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingBindings.push(binding)
    }
  }

  if (missingBindings.length > 0) {
    console.error(
      '❌ Missing required environment bindings:',
      missingBindings.join(', ')
    )
    return c.text(
      'Server configuration error. Please contact the administrator.',
      INTERNAL_SERVER_ERROR
    )
  }

  await next()
}
