/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the sign-up page.
 * @module routes/auth/buildSignUp
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
 * Render the JSX for the sign-up page.
 * @param emailEntered - email entered by user, if any
 */
const renderSignUp = (emailEntered: string) => {
  return (
    <div data-testid='sign-up-page-banner'>
      <div>
        <div>
          <h2>Create Account</h2>

          {/* Sign up form */}
          <form
            method='post'
            action={PATHS.AUTH.SIGN_UP}
            aria-label='Sign up form'
          >
            <div>
              <label htmlFor='signup-name'>
                <span>Name</span>
              </label>
              <input
                id='signup-name'
                name='name'
                type='text'
                placeholder='Enter your name'
                required
                autoFocus
                data-testid='signup-name-input'
                aria-label='Name'
              />
            </div>

            <div>
              <label htmlFor='signup-email'>
                <span>Email</span>
              </label>
              <input
                id='signup-email'
                name='email'
                type='email'
                placeholder={UI_TEXT.ENTER_YOUR_EMAIL}
                required
                value={emailEntered}
                data-testid='signup-email-input'
                aria-label='Email'
              />
            </div>

            <div>
              <label htmlFor='signup-password'>
                <span>Password</span>
              </label>
              <input
                id='signup-password'
                name='password'
                type='password'
                placeholder='Enter your password (min 8 characters)'
                required
                minLength={8}
                data-testid='signup-password-input'
                aria-label='Password'
              />
            </div>

            <div>
              <button type='submit' data-testid='signup-action'>
                Create Account
              </button>
            </div>
          </form>

          {/* Navigation to sign-in page */}
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
 * Attach the sign-up route to the app.
 * @param app - Hono app instance
 */
export const buildSignUp = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(PATHS.AUTH.SIGN_UP, secureHeaders(STANDARD_SECURE_HEADERS), (c) => {
    // Check if user is already signed in using better-auth session
    // Better-auth middleware sets user context, access it properly
    const user = (c as any).get('user')
    if (user) {
      console.log('Already signed in')
      return redirectWithMessage(c, PATHS.PRIVATE, MESSAGES.ALREADY_SIGNED_IN)
    }

    const emailEntered: string = retrieveCookie(c, COOKIES.EMAIL_ENTERED) ?? ''

    setupNoCacheHeaders(c)
    return c.render(useLayout(c, renderSignUp(emailEntered)))
  })
}
