/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the waiting for password reset page.
 * @module routes/auth/buildWaitingForReset
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, COOKIES, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { retrieveCookie, removeCookie } from '../../lib/cookie-support'
import { redirectWithMessage } from '../../lib/redirects'

/**
 * Render the JSX for the waiting for reset page.
 * @param email - User's email address
 */
const renderWaitingForReset = (email: string) => {
  return (
    <div data-testid='waiting-for-reset-page' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <div className='alert alert-info mb-4'>
            <div>
              <h2 className='font-bold text-lg'>Check Your Email</h2>
              <p>
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your email and click the link to reset your
                password.
              </p>
            </div>
          </div>

          <div className='text-center text-sm text-gray-600 mb-4'>
            <p>Didn't receive the email? Check your spam folder.</p>
            <p>The reset link will expire in 24 hours.</p>
          </div>

          <div className='card-actions justify-center'>
            <a
              href={PATHS.AUTH.SIGN_IN}
              className='btn btn-ghost'
              data-testid='back-to-sign-in-from-waiting'
            >
              Back to Sign In
            </a>
          </div>

          <div className='divider'>Need to try again?</div>
          <div className='card-actions justify-center'>
            <a
              href={PATHS.AUTH.FORGOT_PASSWORD}
              className='btn btn-outline btn-secondary'
              data-testid='try-again-button'
            >
              Send Another Reset Link
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the waiting for reset route to the app.
 * @param app - Hono app instance
 */
export const buildWaitingForReset = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.get(
    PATHS.AUTH.WAITING_FOR_RESET,
    secureHeaders(STANDARD_SECURE_HEADERS),
    (c) => {
      setupNoCacheHeaders(c)

      const email = retrieveCookie(c, COOKIES.EMAIL_ENTERED)
      if (!email) {
        return redirectWithMessage(
          c,
          PATHS.AUTH.FORGOT_PASSWORD,
          'Please enter your email address to reset your password.'
        )
      }

      // Clear the email cookie after successful retrieval
      removeCookie(c, COOKIES.EMAIL_ENTERED)

      return c.render(useLayout(c, renderWaitingForReset(email)))
    }
  )
}
