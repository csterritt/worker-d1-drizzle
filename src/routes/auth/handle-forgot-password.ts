/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for forgot password requests.
 * @module routes/auth/handleForgotPassword
 */
import { Context, Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithError, redirectWithMessage } from '../../lib/redirects'
import {
  PATHS,
  COOKIES,
  STANDARD_SECURE_HEADERS,
  DURATIONS,
  LOG_MESSAGES,
  MESSAGES,
  MESSAGE_BUILDERS,
  VALIDATION,
} from '../../constants'
import { addCookie } from '../../lib/cookie-support'
import { Bindings, DrizzleClient } from '../../local-types'
import { createDbClient } from '../../db/client'
import {
  getUserWithAccountByEmail,
  updateAccountTimestamp,
  UserWithAccountData,
} from '../../lib/db-access'
import { validateRequest, ForgotPasswordFormSchema } from '../../lib/validators'

interface RateLimitResult {
  allowed: boolean
  remainingSeconds?: number
}

/**
 * Check if a password reset request is rate limited
 * @param accountUpdatedAt - Last update timestamp from account
 * @returns Rate limit check result
 */
const checkRateLimit = (accountUpdatedAt: Date | null): RateLimitResult => {
  const now = Date.now()
  const lastEmailTime = accountUpdatedAt ? accountUpdatedAt.getTime() : 0
  const timeSinceLastEmail = now - lastEmailTime
  const waitTimeMs = DURATIONS.EMAIL_RESEND_TIME_IN_MILLISECONDS

  if (timeSinceLastEmail < waitTimeMs) {
    const remainingSeconds = Math.ceil((waitTimeMs - timeSinceLastEmail) / 1000)
    return { allowed: false, remainingSeconds }
  }

  return { allowed: true }
}

interface SendResetEmailResult {
  success: boolean
  isEmailError?: boolean
}

/**
 * Send password reset email via better-auth
 * @param env - Environment bindings
 * @param email - User email address
 * @param origin - Request origin for redirect URL
 * @returns Result of email send attempt
 */
const sendPasswordResetEmail = async (
  env: Bindings,
  email: string,
  origin: string
): Promise<SendResetEmailResult> => {
  try {
    const auth = createAuth(env)
    const result = await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${origin}${PATHS.AUTH.RESET_PASSWORD}`,
      },
    })
    console.log('Password reset API result:', result)
    return { success: true }
  } catch (emailError) {
    console.error('Password reset email error:', emailError)

    const errorMessage =
      emailError instanceof Error ? emailError.message : String(emailError)
    const isEmailError =
      errorMessage.includes('Failed to send') || errorMessage.includes('email')

    return { success: false, isEmailError }
  }
}

/**
 * Update account timestamp after sending email
 * @param db - Database client
 * @param userId - User ID to update
 */
const updateEmailTimestamp = async (
  db: DrizzleClient,
  userId: string
): Promise<void> => {
  const updateResult = await updateAccountTimestamp(db, userId)

  if (updateResult.isErr) {
    console.error(LOG_MESSAGES.DB_UPDATE_ACCOUNT_TS, updateResult.error)
  }
}

/**
 * Redirect to waiting page with email cookie set
 * @param c - Hono context
 * @param email - Email to store in cookie
 * @returns Redirect response
 */
const redirectToWaitingPage = (c: Context, email: string): Response => {
  addCookie(c, COOKIES.EMAIL_ENTERED, email)
  return redirectWithMessage(
    c,
    PATHS.AUTH.WAITING_FOR_RESET,
    MESSAGES.RESET_PASSWORD_MESSAGE
  )
}

/**
 * Process the forgot password request for a known user
 * @param c - Hono context
 * @param db - Database client
 * @param userData - User account data
 * @param email - User email
 * @returns Response
 */
const processPasswordReset = async (
  c: Context<{ Bindings: Bindings }>,
  db: DrizzleClient,
  userData: UserWithAccountData,
  email: string
): Promise<Response> => {
  const rateLimitResult = checkRateLimit(userData.accountUpdatedAt)

  if (!rateLimitResult.allowed) {
    return redirectWithError(
      c,
      PATHS.AUTH.FORGOT_PASSWORD,
      MESSAGE_BUILDERS.passwordResetRateLimit(rateLimitResult.remainingSeconds!)
    )
  }

  const origin = new URL(c.req.url).origin
  const emailResult = await sendPasswordResetEmail(c.env, email, origin)

  if (!emailResult.success && emailResult.isEmailError) {
    return redirectWithError(
      c,
      PATHS.AUTH.FORGOT_PASSWORD,
      'Unable to send password reset email. Please try again later.'
    )
  }

  if (emailResult.success) {
    await updateEmailTimestamp(db, userData.userId)
  }

  return redirectToWaitingPage(c, email)
}

/**
 * Attach the forgot password handler to the app.
 * @param app - Hono app instance
 */
export const handleForgotPassword = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.post(
    PATHS.AUTH.FORGOT_PASSWORD,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        const body = await c.req.parseBody()
        const [ok, data, errorMessage] = validateRequest(
          body,
          ForgotPasswordFormSchema
        )

        if (!ok) {
          return redirectWithError(
            c,
            PATHS.AUTH.FORGOT_PASSWORD,
            errorMessage ?? VALIDATION.EMAIL_INVALID
          )
        }

        const email = data!.email as string
        const db = createDbClient(c.env.PROJECT_DB)

        const userWithAccountResult = await getUserWithAccountByEmail(db, email)

        if (userWithAccountResult.isErr) {
          console.error(
            LOG_MESSAGES.DB_GET_USER_WITH_ACCOUNT,
            userWithAccountResult.error
          )
          return redirectToWaitingPage(c, email)
        }

        const userWithAccount = userWithAccountResult.value

        if (userWithAccount.length === 0) {
          // Don't reveal that user doesn't exist for security
          return redirectToWaitingPage(c, email)
        }

        return await processPasswordReset(c, db, userWithAccount[0], email)
      } catch (error) {
        console.error('Forgot password handler error:', error)
        return redirectWithError(
          c,
          PATHS.AUTH.FORGOT_PASSWORD,
          MESSAGES.GENERIC_ERROR_TRY_AGAIN
        )
      }
    }
  )
}
