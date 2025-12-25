/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Better Auth integration handler for Hono
 * @module routes/auth/better-auth-handler
 */
import { Hono, Context, Next } from 'hono'

import { createAuth } from '../../lib/auth'
import type {
  Bindings,
  AuthUser,
  AuthSession,
  AuthSessionResponse,
} from '../../local-types'

// Type definitions for better-auth context variables
export interface BetterAuthVariables {
  user: AuthUser | null
  session: AuthSession | null
  authSession: AuthSessionResponse | null
}

type AppEnv = { Bindings: Bindings; Variables: BetterAuthVariables }
type AppContext = Context<AppEnv>

// Extended Hono type with better-auth variables (kept for reference)

/**
 * Setup better-auth routes in the Hono app
 * @param app - Hono app instance
 */
export const setupBetterAuth = (app: Hono<{ Bindings: Bindings }>): void => {
  console.log('🔧 Setting up better-auth routes...')

  // Better-auth handler with enhanced debugging
  app.all('/api/auth/*', async (c: AppContext) => {
    console.log('🔔 Better-auth route hit:', c.req.method, c.req.url)
    console.log('🔧 Environment check:', {
      PROJECT_DB: !!c.env.PROJECT_DB,
      envKeys: Object.keys(c.env || {}), // PRODUCTION:REMOVE
    })

    try {
      console.log('🔧 Creating auth instance...')
      const auth = createAuth(c.env)
      console.log('🔧 Auth instance created successfully')

      console.log('🔧 Calling auth.handler with request...')
      console.log('🔧 Request details:', {
        method: c.req.method,
        url: c.req.url,
        headers: Object.fromEntries(c.req.raw.headers.entries()), // PRODUCTION:REMOVE
      })

      const response = await auth.handler(c.req.raw)
      console.log('✅ Auth handler response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()), // PRODUCTION:REMOVE
      })

      return response
    } catch (error) {
      console.error('❌ Better-auth handler error:', error)
      console.error('❌ Error stack:', (error as Error)?.stack)
      return new Response('Internal Server Error', { status: 500 })
    }
  })

  console.log('✅ Better-auth routes setup complete')
}

/**
 * Better Auth middleware to provide session and user context
 * @param app - Hono app instance
 */
export const setupBetterAuthMiddleware = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.use('*', async (c: AppContext, next: Next) => {
    try {
      const auth = createAuth(c.env)
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
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
