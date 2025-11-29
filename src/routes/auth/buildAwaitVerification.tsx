/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the await verification page.
 * @module routes/auth/buildAwaitVerification
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, COOKIES, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { retrieveCookie, removeCookie } from '../../lib/cookie-support'

/**
 * Render the JSX for the await verification page.
 * @param email - User's email address (optional)
 */
const renderAwaitVerification = (email?: string) => {
  return (
    <div data-testid='await-verification-page'>
      <div>
        <div>
          <div>
            <div>
              <div>
                <h2>Check Your Email</h2>
                <p>
                  We've sent a verification link to{' '}
                  {email ? <span>{email}</span> : 'your email address'}.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p>
              Please check your email and click the verification link to
              complete your account setup. You'll need to verify your email
              before you can sign in.
            </p>

            <div>
              <h3>Don't see the email?</h3>
              <ul>
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>The email may take a few minutes to arrive</li>
              </ul>
            </div>

            <div>
              <a href={PATHS.AUTH.SIGN_IN} data-testid='back-to-sign-in-action'>
                Back to Sign In
              </a>
              {email && (
                <form method='post' action={PATHS.AUTH.RESEND_EMAIL}>
                  <input type='hidden' name='email' value={email} />
                  <button type='submit' data-testid='resend-email-action'>
                    Resend Email
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the await verification route to the app.
 * @param app - Hono app instance
 */
export const buildAwaitVerification = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.get(
    PATHS.AUTH.AWAIT_VERIFICATION,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      setupNoCacheHeaders(c)

      // Get email from COOKIES.EMAIL_ENTERED cookie
      const email = retrieveCookie(c, COOKIES.EMAIL_ENTERED)

      // If no email cookie is present, redirect to sign-in page
      if (!email) {
        return c.redirect(PATHS.AUTH.SIGN_IN)
      }

      // Remove the email cookie after retrieving it
      removeCookie(c, COOKIES.EMAIL_ENTERED)

      return c.render(useLayout(c, renderAwaitVerification(email)))
    }
  )
}
