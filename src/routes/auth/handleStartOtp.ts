/**
 * Route handler for the start OTP path (POST).
 * @module routes/auth/handleStartOtp
 */
import { Context, Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { ulid } from 'ulid'
import Result, { isErr } from 'true-myth/result'
import { isNothing } from 'true-myth/maybe'

import {
  PATHS,
  COOKIES,
  DURATIONS,
  VALIDATION,
  STANDARD_SECURE_HEADERS,
} from '../../constants'
import { Bindings } from '../../local-types'
import { redirectWithError, redirectWithMessage } from '../../lib/redirects'
import {
  findUserByEmail,
  createSession,
  deleteSession,
  countRecentNonSignedInSessionsByEmail,
} from '../../lib/db/auth-access'
import { generateToken } from '../../lib/generate-code'
import { getCurrentTime } from '../../lib/time-access'
import { StartOtpSchema, validateRequest } from '../../lib/validators'
import { addCookie, removeCookie } from '../../lib/cookie-support'
// import { sendOtpToUserViaEmail } from '../../lib/send-email' // PRODUCTION:UNCOMMENT

// Maximum number of non-signed-in sessions allowed in the rate limit window
const MAX_REQUESTS_PER_WINDOW = 3

/**
 * Check if the email has exceeded the rate limit
 * @param c - Hono context
 * @param db - D1Database instance
 * @param email - The email to check
 * @returns Promise<boolean> - true if rate limited, false otherwise
 */
async function isRateLimited(
  c: Context,
  db: D1Database,
  email: string
): Promise<boolean> {
  const countResult = await countRecentNonSignedInSessionsByEmail(
    c,
    db,
    email,
    DURATIONS.RATE_LIMIT_WINDOW_MS
  )

  if (isErr(countResult)) {
    console.error(`Error checking rate limit: ${countResult.error}`)
    return false // Default to not rate-limited on error
  }

  return countResult.value > MAX_REQUESTS_PER_WINDOW
}

/**
 * Attach the start OTP POST route to the app.
 * @param app - Hono app instance
 */
export const handleStartOtp = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(
    PATHS.AUTH.START_OTP,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      // Example: validate email and handle OTP start logic
      const formData = await c.req.parseBody()

      const enteredEmail =
        typeof formData.email === 'string' ? formData.email.trim() : ''

      // Store the entered email in a cookie
      addCookie(c, COOKIES.EMAIL_ENTERED, enteredEmail)
      // Validate the request using Valibot schema
      let [isValid, validatedData, errorMessage] = validateRequest(
        formData,
        StartOtpSchema
      )

      if (!isValid || !validatedData) {
        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          errorMessage || VALIDATION.EMAIL_INVALID
        )
      }

      const email = validatedData.email
      const now = getCurrentTime(c).getTime()

      // Check rate limiting
      const rateLimited = await isRateLimited(c, c.env.PROJECT_DB, email)
      if (rateLimited) {
        // Set retry-after header (in seconds)
        c.header(
          'Retry-After',
          Math.ceil(DURATIONS.RATE_LIMIT_WINDOW_MS / 1000).toString()
        )
        // Return 429 Too Many Requests
        return c.text(
          'Too many OTP requests. Please try again later due to rate limit.',
          429
        )
      }

      // Is there a session already?
      if (c.env.Session.isJust && c.env.Session.value.signedIn) {
        return redirectWithError(c, PATHS.PRIVATE, 'You are already signed in')
      }

      // Check if user exists in the database
      const userResult = await findUserByEmail(c.env.PROJECT_DB, email)
      if (isErr(userResult)) {
        console.log(`======> Database error getting user: ${userResult.error}`)
        return redirectWithError(c, PATHS.AUTH.SIGN_IN, 'Database error')
      }

      const maybeUser = userResult.value
      if (isNothing(maybeUser)) {
        console.log(`There is no user for the %s email`, email)
        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          VALIDATION.EMAIL_INVALID
        )
      }
      const user = maybeUser.value

      // Create a new session for the user
      const sessionId: string = ulid()
      const sessionToken: string = await generateToken()
      const nowDate = getCurrentTime(c)
      // Session expires in 15 minutes
      const expiresAt = getCurrentTime(
        c,
        nowDate.getTime() + DURATIONS.FIFTEEN_MINUTES_IN_MILLISECONDS
      )

      const sessionResult = await createSession(c.env.PROJECT_DB, {
        id: sessionId,
        token: sessionToken,
        userId: user.id,
        signedIn: false,
        createdAt: nowDate.getTime(),
        updatedAt: nowDate.getTime(),
        expiresAt: expiresAt.getTime(),
      })

      if (isErr(sessionResult)) {
        // TODO: Figure out what to do here with session and cookies
        console.log(
          `======> Database error getting session: ${sessionResult.error}`
        )
        return redirectWithError(c, PATHS.AUTH.SIGN_IN, 'Database error')
      }
      addCookie(c, COOKIES.SESSION, sessionId)
      c.header('X-Session-Token', sessionToken) // PRODUCTION:REMOVE

      // Send the OTP code to the user via email
      console.log(`======> The session token is ${sessionToken}`) // PRODUCTION:REMOVE

      const res = Result.ok(true) // PRODUCTION:REMOVE
      // const res = await sendOtpToUserViaEmail(email, sessionToken) // PRODUCTION:UNCOMMENT
      if (res.isErr) {
        console.error('Failed to send email:', res.error)
        await deleteSession(c.env.PROJECT_DB, sessionId)
        removeCookie(c, COOKIES.SESSION)

        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          'Failed to send email, please try again'
        )
      }

      // For now, just redirect to await code page
      return redirectWithMessage(c, PATHS.AUTH.AWAIT_CODE, '')
    }
  )
}
