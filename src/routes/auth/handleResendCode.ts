/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route handler for the resend OTP code path (POST).
 * @module routes/auth/handleResendCode
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import Result, { isErr } from 'true-myth/result'
import { isNothing } from 'true-myth/maybe'

import {
  PATHS,
  COOKIES,
  DURATIONS,
  STANDARD_SECURE_HEADERS,
} from '../../constants'
import { Bindings } from '../../local-types'
import { removeCookie } from '../../lib/cookie-support'
import { redirectWithError, redirectWithMessage } from '../../lib/redirects'
import {
  deleteSession,
  findUserById,
  updateSessionById,
} from '../../lib/db/auth-access'
import { generateToken } from '../../lib/generate-code'
import { getCurrentTime } from '../../lib/time-access'
import { ResendCodeSchema, validateRequest } from '../../lib/validators'
// import { sendOtpToUserViaEmail } from '../../lib/send-email' // PRODUCTION:UNCOMMENT

/**
 * Attach the resend OTP POST route to the app.
 * @param app - Hono app instance
 */
export const handleResendCode = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(
    PATHS.AUTH.RESEND_CODE,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      // Validate and handle OTP finish logic
      const formData = await c.req.parseBody()

      // Validate the request using Valibot schema
      const [isValid, validatedData, errorMessage] = validateRequest(
        formData,
        ResendCodeSchema
      )

      if (!isValid || !validatedData) {
        return redirectWithError(
          c,
          PATHS.AUTH.AWAIT_CODE,
          errorMessage || 'Invalid input'
        )
      }

      const email = validatedData.email

      if (c.env.Session.isNothing) {
        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          'Sign in flow problem, please sign in again'
        )
      }

      const session = c.env.Session.value

      // see if this session has expired
      const now = getCurrentTime(c)
      if (session.expiresAt < now.getTime()) {
        await deleteSession(c.env.PROJECT_DB, session.id)
        removeCookie(c, COOKIES.SESSION)

        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          'Sign in code has expired, please sign in again'
        )
      }

      // see if the user has not waited long enough to ask for another code
      const ago = now.getTime() - DURATIONS.THIRTY_SECONDS_IN_MILLISECONDS
      if (session.updatedAt > ago) {
        const secondsLeft = Math.floor((session.updatedAt - ago) / 1000)

        return redirectWithError(
          c,
          PATHS.AUTH.AWAIT_CODE,
          `Please wait another ${secondsLeft} seconds before asking for another code`
        )
      }

      const userResult = await findUserById(c.env.PROJECT_DB, session.userId)
      if (isErr(userResult)) {
        // TODO: clean out session and cookies
        console.log(`======> Database error getting user: ${userResult.error}`)
        return redirectWithError(c, PATHS.AUTH.SIGN_IN, 'Database error')
      }

      const maybeUser = userResult.value
      if (isNothing(maybeUser)) {
        await deleteSession(c.env.PROJECT_DB, session.id)
        removeCookie(c, COOKIES.SESSION)
        removeCookie(c, COOKIES.EMAIL_ENTERED)

        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          'Sign in flow problem, please sign in again'
        )
      }

      const user = maybeUser.value
      if (user.email !== email) {
        await deleteSession(c.env.PROJECT_DB, session.id)
        removeCookie(c, COOKIES.SESSION)
        removeCookie(c, COOKIES.EMAIL_ENTERED)

        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          'Sign in flow problem, please sign in again'
        )
      }

      // Update session: expire in 15 minutes
      const expiresAt = getCurrentTime(
        c,
        now.getTime() + DURATIONS.FIFTEEN_MINUTES_IN_MILLISECONDS
      ).getTime()
      const sessionToken: string = await generateToken()
      const updateResult = await updateSessionById(
        c.env.PROJECT_DB,
        session.id,
        {
          token: sessionToken,
          expiresAt,
          updatedAt: getCurrentTime(c).getTime(),
        }
      )

      if (isErr(updateResult)) {
        // TODO: figure out what to do here with session and cookies
        console.log(
          `======> Database error updating session: ${updateResult.error}`
        )

        return redirectWithError(c, PATHS.AUTH.SIGN_IN, 'Database error')
      }

      // Send the OTP code to the user via email
      c.header('X-Session-Token', sessionToken) // PRODUCTION:REMOVE
      console.log(`======> The session token is ${sessionToken}`) // PRODUCTION:REMOVE

      const res = Result.ok(true) // PRODUCTION:REMOVE
      // const res = await sendOtpToUserViaEmail(email, sessionToken) // PRODUCTION:UNCOMMENT
      if (res.isErr) {
        console.error('Failed to send email:', res.error)
        await deleteSession(c.env.PROJECT_DB, session.id)
        removeCookie(c, COOKIES.SESSION)

        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          'Failed to send email, please try again'
        )
      }

      // In a real implementation, you would trigger the resend logic here.
      return redirectWithMessage(c, PATHS.AUTH.AWAIT_CODE, 'Code sent!')
    }
  )
}
