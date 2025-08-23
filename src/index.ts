/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { csrf } from 'hono/csrf'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'

import { HTML_STATUS } from './constants'
import { renderer } from './renderer'
import { buildRoot } from './routes/buildRoot' // PRODUCTION:REMOVE
import { buildPrivate } from './routes/buildPrivate'
import { build404 } from './routes/build404'
import { buildEmailConfirmation } from './routes/auth/buildEmailConfirmation'
import { buildAwaitVerification } from './routes/auth/buildAwaitVerification'
import { createDbClient } from './db/client'
import { buildSignIn } from './routes/auth/buildSignIn'
import { buildSignUp } from './routes/auth/buildSignUp'
import { buildForgotPassword } from './routes/auth/buildForgotPassword'
import { buildWaitingForReset } from './routes/auth/buildWaitingForReset'
import { buildResetPassword } from './routes/auth/buildResetPassword'
import { handleSignIn } from './routes/auth/handleSignIn'
import { handleSignUp } from './routes/auth/handleSignUp'
import { handleSignOut } from './routes/auth/handleSignOut'
import { handleResendEmail } from './routes/auth/handleResendEmail'
import { handleForgotPassword } from './routes/auth/handleForgotPassword'
import { handleResetPassword } from './routes/auth/handleResetPassword'
import {
  setupBetterAuth,
  setupBetterAuthMiddleware,
} from './routes/auth/better-auth-handler'
import { setupBetterAuthResponseInterceptor } from './routes/auth/betterAuthResponseInterceptor'

import { Bindings } from './local-types'
import { handleSetClock } from './routes/auth/handleSetClock' // PRODUCTION:REMOVE
import { handleResetClock } from './routes/auth/handleResetClock' // PRODUCTION:REMOVE
import { handleSetDbFailures } from './routes/handleSetDbFailures' // PRODUCTION:REMOVE
import { testDatabaseRouter } from './routes/test/database' // PRODUCTION:REMOVE

const app = new Hono<{ Bindings: Bindings }>()

const signUpMode = process.env.SIGN_UP_MODE
console.log(`🔧 SIGN_UP_MODE: ${signUpMode}`)

let alternateOrigin = /http:\/\/localhost(:\d+)?$/ // PRODUCTION:REMOVE
// PRODUCTION:REMOVE-NEXT-LINE
if (process.env.ALTERNATE_ORIGIN) {
  alternateOrigin = new RegExp(process.env.ALTERNATE_ORIGIN) // PRODUCTION:REMOVE
} // PRODUCTION:REMOVE

// Apply middleware
app.use(secureHeaders({ referrerPolicy: 'strict-origin-when-cross-origin' }))
// Apply CSRF protection to all routes except test endpoints
app.use(async (c, next) => {
  // Skip CSRF for test endpoints // PRODUCTION:REMOVE
  // PRODUCTION:REMOVE-NEXT-LINE
  if (c.req.path.startsWith('/test/')) {
    return next() // PRODUCTION:REMOVE
  } // PRODUCTION:REMOVE

  // Apply CSRF protection to all other routes
  const csrfMiddleware = csrf({
    origin: (origin: string) => {
      // return /https:\/\/mini-auth.example.com$/.test(origin) || // PRODUCTION:UNCOMMENT
      //  /https:\/\/mini-auth.example.workers.dev$/.test(origin)  // PRODUCTION:UNCOMMENT
      // PRODUCTION:REMOVE-NEXT-LINE
      return (
        /http:\/\/localhost(:\d+)?$/.test(origin) || // PRODUCTION:REMOVE
        alternateOrigin.test(origin) // PRODUCTION:REMOVE
      ) // PRODUCTION:REMOVE
    },
  })

  return csrfMiddleware(c, next)
})
app.use(
  bodyLimit({
    // maxSize: 4 * 1024, // 4kb // PRODUCTION:UNCOMMENT
    maxSize: 1024, // 50kb // PRODUCTION:REMOVE
    onError: (c) => {
      console.log('Body limit exceeded')
      return c.text('overflow :(', HTML_STATUS.CONTENT_TOO_LARGE)
    },
  })
)

app.use(logger())
app.use(renderer)

// Initialize db client for each request
app.use(async (c, next) => {
  // Create DB client for this request
  const db = createDbClient(c.env.PROJECT_DB)
  c.set('db', db)

  await next()
})

// Setup auth middleware and routes
console.log('🔧 Setting up auth middleware...')
setupBetterAuthMiddleware(app)
console.log('🔧 Setting up auth response interceptor...')
setupBetterAuthResponseInterceptor(app) // Must come before setupBetterAuth to intercept responses
console.log('🔧 About to call setupBetterAuth...')
setupBetterAuth(app)
console.log('🔧 setupBetterAuth call completed')

// Route declarations
buildRoot(app) // PRODUCTION:REMOVE
buildPrivate(app)
buildSignIn(app)
buildSignUp(app)
buildForgotPassword(app)
buildWaitingForReset(app)
buildResetPassword(app)
buildEmailConfirmation(app)
buildAwaitVerification(app)
handleSignUp(app)
handleSignOut(app)
handleResendEmail(app)
handleForgotPassword(app)
handleResetPassword(app)

handleSetClock(app) // PRODUCTION:REMOVE
handleResetClock(app) // PRODUCTION:REMOVE
handleSetDbFailures(app) // PRODUCTION:REMOVE

// Test-only database endpoints // PRODUCTION:REMOVE
app.route('/test/database', testDatabaseRouter) // PRODUCTION:REMOVE

// this MUST be the last route declared!
build404(app)

export default app
