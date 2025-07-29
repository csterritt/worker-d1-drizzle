/**
 * Route handler for the finish OTP path (POST).
 * @module routes/auth/handleFinishOtp
 */
import { Hono } from 'hono'
import { isErr } from 'true-myth/result'
import { isNothing } from 'true-myth/maybe'

import { PATHS, COOKIES, DURATIONS } from '../../constants'
import { Bindings, SignInSession } from '../../local-types'
import { redirectWithError, redirectWithMessage } from '../../lib/redirects'
import {
  deleteSession,
  findUserById,
  updateSessionById,
} from '../../lib/db/auth-access'
import { getCurrentTime } from '../../lib/time-access'
import { FinishOtpSchema, validateRequest } from '../../lib/validators'
import { addCookie, removeCookie } from '../../lib/cookie-support'
// import { pushoverNotify } from '../../lib/po-notify'  // PRODUCTION:UNCOMMENT

/**
 * Attach the finish OTP POST route to the app.
 * @param app - Hono app instance
 */
export const handleFinishOtp = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(PATHS.AUTH.FINISH_OTP, async (c) => {
    // Validate and handle OTP finish logic
    const formData = await c.req.parseBody()

    // Validate the request using Valibot schema
    const [isValid, validatedData, errorMessage] = validateRequest(
      formData,
      FinishOtpSchema
    )

    if (!isValid || !validatedData) {
      return redirectWithError(
        c,
        PATHS.AUTH.AWAIT_CODE,
        errorMessage || 'Invalid input'
      )
    }

    const email = validatedData.email
    const otp = validatedData.otp

    // No session?
    if (c.env.Session.isNothing) {
      return redirectWithError(
        c,
        PATHS.AUTH.SIGN_IN,
        'Sign in flow problem, please sign in again'
      )
    }

    const session: SignInSession = c.env.Session.value

    // see if this session has expired
    const now = getCurrentTime(c).getTime()
    if (session.expiresAt < now) {
      await deleteSession(c.env.PROJECT_DB, session.id)
      removeCookie(c, COOKIES.SESSION)

      return redirectWithError(
        c,
        PATHS.AUTH.SIGN_IN,
        'Sign in code has expired, please sign in again'
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

    if (session.token !== otp) {
      // PRODUCTION:REMOVE-NEXT-LINE
      if (otp !== '123456') {
        // Increment attemptCount
        const newAttemptCount: number = session.attemptCount + 1
        if (newAttemptCount >= 3) {
          await deleteSession(c.env.PROJECT_DB, session.id)
          removeCookie(c, COOKIES.SESSION)

          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_IN,
            'Too many failed attempts. Please sign in again.'
          )
        }

        // Save updated attemptCount in session
        await updateSessionById(c.env.PROJECT_DB, session.id, {
          attemptCount: newAttemptCount,
          updatedAt: getCurrentTime(c).getTime(),
        })

        return redirectWithError(
          c,
          PATHS.AUTH.AWAIT_CODE,
          'Invalid OTP or verification failed'
        )
        // PRODUCTION:REMOVE-NEXT-LINE
      }
    }

    // Update session: expire in 6 months, set signedIn true
    const now2 = getCurrentTime(c)
    const expiresAt = getCurrentTime(
      c,
      now2.getTime() + DURATIONS.SIX_MONTHS_IN_MILLISECONDS
    )
    const updateResult = await updateSessionById(c.env.PROJECT_DB, session.id, {
      signedIn: true,
      token: '',
      attemptCount: 0,
      expiresAt: expiresAt.getTime(),
      updatedAt: now2.getTime(),
    })

    if (isErr(updateResult)) {
      // TODO: figure out what to do here with session and cookies
      console.log(
        `======> Database error updating session: ${updateResult.error}`
      )

      return redirectWithError(c, PATHS.AUTH.SIGN_IN, 'Database error')
    }

    // const msg = `${user.email} signed in successfully to the application` // PRODUCTION:UNCOMMENT
    // await pushoverNotify(c, msg) // PRODUCTION:UNCOMMENT

    removeCookie(c, COOKIES.EMAIL_ENTERED)
    removeCookie(c, COOKIES.ERROR_FOUND)
    addCookie(c, COOKIES.SESSION, session.id, {
      expires: expiresAt,
    })

    // Redirect to sign-in with a success message (or next step)
    return redirectWithMessage(
      c,
      PATHS.PRIVATE,
      'You have signed in successfully!'
    )
  })
}
