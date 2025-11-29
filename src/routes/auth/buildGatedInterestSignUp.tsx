/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the combined gated + interest sign-up page.
 * @module routes/auth/buildGatedInterestSignUp
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import {
  PATHS,
  STANDARD_SECURE_HEADERS,
  MESSAGES,
  UI_TEXT,
} from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { COOKIES } from '../../constants'
import { redirectWithMessage } from '../../lib/redirects'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { retrieveCookie } from '../../lib/cookie-support'

/**
 * Render the JSX for the combined gated + interest sign-up page.
 * @param emailEntered - email entered by user, if any
 */
const renderGatedInterestSignUp = (emailEntered: string) => {
  return (
    <div data-testid='sign-up-page-banner'>
      <div>
        <div>
          <h2>Create Account</h2>
          <p>
            Have a sign-up code? Create your account below. Otherwise, join our
            waitlist to be notified when we're accepting new accounts.
          </p>

          {/* Gated sign up form */}
          <div>
            <h3>Sign Up with Code</h3>
            <form
              method='post'
              action={PATHS.AUTH.SIGN_UP}
              className='flex flex-col gap-4'
              aria-label='Gated sign up form'
              noValidate
            >
              <div>
                <label htmlFor='gated-signup-code'>
                  <span>Sign-up Code *</span>
                </label>
                <input
                  id='gated-signup-code'
                  name='code'
                  type='text'
                  placeholder='Enter your sign-up code'
                  required
                  autoFocus
                  data-testid='gated-signup-code-input'
                  aria-label='Sign-up Code'
                />
              </div>

              <div>
                <label htmlFor='gated-signup-name'>
                  <span>Name *</span>
                </label>
                <input
                  id='gated-signup-name'
                  name='name'
                  type='text'
                  placeholder='Enter your name'
                  required
                  data-testid='gated-signup-name-input'
                  aria-label='Name'
                />
              </div>

              <div>
                <label htmlFor='gated-signup-email'>
                  <span>Email *</span>
                </label>
                <input
                  id='gated-signup-email'
                  name='email'
                  type='email'
                  placeholder={UI_TEXT.ENTER_YOUR_EMAIL}
                  required
                  value={emailEntered}
                  data-testid='gated-signup-email-input'
                  aria-label='Email'
                />
              </div>

              <div>
                <label htmlFor='gated-signup-password'>
                  <span>Password *</span>
                </label>
                <input
                  id='gated-signup-password'
                  name='password'
                  type='password'
                  placeholder='Enter your password (min 8 characters)'
                  required
                  minLength={8}
                  data-testid='gated-signup-password-input'
                  aria-label='Password'
                />
              </div>

              <div>
                <button type='submit' data-testid='gated-signup-action'>
                  Create Account
                </button>
              </div>
            </form>
          </div>

          {/* Divider */}
          <div style={{ margin: '2rem 0', textAlign: 'center' }}>
            <hr />
            <span>OR</span>
          </div>

          {/* Interest sign-up form */}
          <div>
            <h3>Join the Waitlist</h3>
            <p>
              Don't have a code? Enter your email to be notified when we're
              accepting new accounts.
            </p>
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
          </div>

          {/* Navigation to sign-in page */}
          <div style={{ marginTop: '2rem' }}>Already have an account?</div>
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
 * Attach the combined gated + interest sign-up route to the app.
 * @param app - Hono app instance
 */
export const buildGatedInterestSignUp = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.get(PATHS.AUTH.SIGN_UP, secureHeaders(STANDARD_SECURE_HEADERS), (c) => {
    // Check if user is already signed in using better-auth session
    const user = (c as any).get('user')
    if (user) {
      console.log('Already signed in')
      return redirectWithMessage(c, PATHS.PRIVATE, MESSAGES.ALREADY_SIGNED_IN)
    }

    const emailEntered: string = retrieveCookie(c, COOKIES.EMAIL_ENTERED) ?? ''

    setupNoCacheHeaders(c)
    return c.render(useLayout(c, renderGatedInterestSignUp(emailEntered)))
  })
}
