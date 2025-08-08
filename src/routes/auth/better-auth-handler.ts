/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Better Auth integration handler for Hono
 * @module routes/auth/better-auth-handler
 */
import { Hono } from 'hono'
import { createAuth, type Auth } from '../../lib/auth'
import { Bindings } from '../../local-types'

// Type definitions for better-auth context variables
export interface BetterAuthVariables {
  user: any | null
  session: any | null
  authSession: any | null
}

// Extended Hono type with better-auth variables
type BetterAuthHono = Hono<{ 
  Bindings: Bindings
  Variables: BetterAuthVariables
}>

/**
 * Setup better-auth routes in the Hono app
 * @param app - Hono app instance
 */
export const setupBetterAuth = (app: any) => {
  // Mount better-auth API endpoints
  app.on(['POST', 'GET'], '/api/auth/*', async (c: any) => {
    const auth = createAuth(c.env.PROJECT_DB)
    return auth.handler(c.req.raw)
  })
}

/**
 * Better Auth middleware to provide session and user context
 * @param app - Hono app instance
 */
export const setupBetterAuthMiddleware = (app: any) => {
  app.use('*', async (c: any, next: any) => {
    try {
      const auth = createAuth(c.env.PROJECT_DB)
      const session = await auth.api.getSession({ 
        headers: c.req.raw.headers 
      })

      if (!session) {
        c.set('user', null)
        c.set('session', null)
        c.set('authSession', null)
        return next()
      }

      c.set('user', session.user)
      c.set('session', session.session)
      c.set('authSession', session)
      return next()
    } catch (error) {
      console.error('Better Auth middleware error:', error)
      c.set('user', null)
      c.set('session', null)
      c.set('authSession', null)
      return next()
    }
  })
}
