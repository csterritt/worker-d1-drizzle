/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the interest sign-up page.
 * @module routes/auth/buildInterestSignUp
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS, MESSAGES } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { COOKIES } from '../../constants'
import { redirectWithMessage } from '../../lib/redirects'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { retrieveCookie } from '../../lib/cookie-support'

/**
 * Render the JSX for the interest sign-up page.
 * @param emailEntered - email entered by user, if any
 */
const renderInterestSignUp = (emailEntered: string) => {
  return (
    <div data-testid='sign-up-page-banner'>
      <div>
        <div>
          <h2>Join the Waitlist</h2>

          <div>
            <h4>
              We're not accepting new accounts at the moment, but we'd love to
              notify you when we are! Enter your email address to join our
              waitlist.
            </h4>
          </div>

          {/* Interest sign-up form */}
          <form
            method='post'
            action={PATHS.AUTH.INTEREST_SIGN_UP}
            aria-label='Interest sign up form'
            noValidate
          >
            <div>
              <label htmlFor='interest-email'>
                <span>Email Address</span>
              </label>
              <input
                id='interest-email'
                name='email'
                type='email'
                placeholder='Enter your email address'
                required
                autoFocus
                value={emailEntered}
                data-testid='interest-email-input'
                aria-label='Email'
              />
            </div>

            <div>
              <button type='submit' data-testid='interest-action'>
                Join Waitlist
              </button>
            </div>
          </form>

          {/* Navigation back to sign-in page */}
          <div>Already have an account?</div>
          <div>
            <a href={PATHS.AUTH.SIGN_IN} data-testid='go-to-sign-in-action'>
              Sign In Instead
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the interest sign-up route to the app.
 * @param app - Hono app instance
 */
export const buildInterestSignUp = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.get(
    PATHS.AUTH.INTEREST_SIGN_UP,
    secureHeaders(STANDARD_SECURE_HEADERS),
    (c) => {
      // Check if user is already signed in using better-auth session
      const user = (c as any).get('user')
      if (user) {
        console.log('Already signed in')
        return redirectWithMessage(c, PATHS.PRIVATE, MESSAGES.ALREADY_SIGNED_IN)
      }

      const emailEntered: string =
        retrieveCookie(c, COOKIES.EMAIL_ENTERED) ?? ''

      setupNoCacheHeaders(c)
      return c.render(useLayout(c, renderInterestSignUp(emailEntered)))
    }
  )
}
