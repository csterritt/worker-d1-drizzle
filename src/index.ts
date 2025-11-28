/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { csrf } from 'hono/csrf'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { showRoutes } from 'hono/dev' // PRODUCTION:REMOVE

import { HTML_STATUS, SIGN_UP_MODES } from './constants'
import { renderer } from './renderer'
import { buildRoot } from './routes/buildRoot' // PRODUCTION:REMOVE
import { buildPrivate } from './routes/buildPrivate'
import { build404 } from './routes/build404'
import { buildEmailConfirmation } from './routes/auth/buildEmailConfirmation'
import { buildAwaitVerification } from './routes/auth/buildAwaitVerification'
import { createDbClient } from './db/client'
import { buildSignIn } from './routes/auth/buildSignIn'
import { buildSignUp } from './routes/auth/buildSignUp'
import { buildGatedSignUp } from './routes/auth/buildGatedSignUp'
import { buildInterestSignUp } from './routes/auth/buildInterestSignUp'
import { buildGatedInterestSignUp } from './routes/auth/buildGatedInterestSignUp'
import { buildForgotPassword } from './routes/auth/buildForgotPassword'
import { buildWaitingForReset } from './routes/auth/buildWaitingForReset'
import { buildResetPassword } from './routes/auth/buildResetPassword'
import { handleSignUp } from './routes/auth/handleSignUp'
import { handleGatedSignUp } from './routes/auth/handleGatedSignUp'
import { handleInterestSignUp } from './routes/auth/handleInterestSignUp'
import { handleGatedInterestSignUp } from './routes/auth/handleGatedInterestSignUp'
import { handleSignOut } from './routes/auth/handleSignOut'
import { handleResendEmail } from './routes/auth/handleResendEmail'
import { handleForgotPassword } from './routes/auth/handleForgotPassword'
import { handleResetPassword } from './routes/auth/handleResetPassword'
import { buildProfile } from './routes/profile/buildProfile'
import { handleChangePassword } from './routes/profile/handleChangePassword'
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
import { testSignUpModeRouter } from './routes/test/sign-up-mode' // PRODUCTION:REMOVE
import { testSmtpRouter } from './routes/test/smtp-config' // PRODUCTION:REMOVE

/**
 * Validates that all required environment variables are set
 * Returns `false` if any required variables are missing, otherwise returns `true`
 */
const validateEnvironmentVariables = (): boolean => {
  const requiredVars = [
    'BETTER_AUTH_SECRET',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_DATABASE_ID',
    'CLOUDFLARE_D1_TOKEN',
    'SIGN_UP_MODE',
    'EMAIL_SEND_URL',
    'EMAIL_SEND_CODE',
  ]

  const missingVars: string[] = []

  for (const varName of requiredVars) {
    if (!process.env[varName] || process.env[varName]?.trim() === '') {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ ERROR: Missing required environment variables:')
    for (const varName of missingVars) {
      console.error(`   - ${varName}`)
    }
    console.error(
      '\nPlease set these environment variables before starting the application.'
    )
    return false
  }

  console.log('✅ All required environment variables are set')
  return true
}

// Validate environment variables on startup
if (!validateEnvironmentVariables()) {
  console.log('==============> Environment variables are not valid!')
  console.log('==============> Environment variables are not valid!')
  console.log('==============> Environment variables are not valid!')
  console.log('==============> Environment variables are not valid!')
  console.log('==============> Environment variables are not valid!')
}

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
if (process.env.SIGN_UP_MODE === SIGN_UP_MODES.OPEN_SIGN_UP) {
  buildSignUp(app)
  handleSignUp(app)
  buildAwaitVerification(app)
  handleResendEmail(app)
} else if (process.env.SIGN_UP_MODE === SIGN_UP_MODES.GATED_SIGN_UP) {
  buildGatedSignUp(app)
  handleGatedSignUp(app)
  buildAwaitVerification(app)
  handleResendEmail(app)
} else if (process.env.SIGN_UP_MODE === SIGN_UP_MODES.INTEREST_SIGN_UP) {
  buildInterestSignUp(app)
  handleInterestSignUp(app)
  buildAwaitVerification(app)
  handleResendEmail(app)
} else if (process.env.SIGN_UP_MODE === SIGN_UP_MODES.BOTH_SIGN_UP) {
  buildGatedInterestSignUp(app)
  handleGatedInterestSignUp(app)
  buildAwaitVerification(app)
  handleResendEmail(app)
}
buildForgotPassword(app)
buildWaitingForReset(app)
buildResetPassword(app)
buildEmailConfirmation(app)
handleSignOut(app)
handleForgotPassword(app)
handleResetPassword(app)
buildProfile(app)
handleChangePassword(app)

handleSetClock(app) // PRODUCTION:REMOVE
handleResetClock(app) // PRODUCTION:REMOVE
handleSetDbFailures(app) // PRODUCTION:REMOVE

// Test-only database endpoints // PRODUCTION:REMOVE
app.route('/test/database', testDatabaseRouter) // PRODUCTION:REMOVE
app.route('/test/sign-up-mode', testSignUpModeRouter) // PRODUCTION:REMOVE
app.route('/test', testSmtpRouter) // PRODUCTION:REMOVE

// this MUST be the last route declared!
build404(app)
showRoutes(app) // PRODUCTION:REMOVE

export default app
