/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the forgot password page.
 * @module routes/auth/buildForgotPassword
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'

/**
 * Render the JSX for the forgot password page.
 */
const renderForgotPassword = () => {
  return (
    <div data-testid='forgot-password-page'>
      <div>
        <div>
          <h2>Reset Your Password</h2>

          <p>
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          {/* Forgot password form */}
          <form
            method='post'
            action='/auth/forgot-password'
            aria-label='Forgot password form'
            noValidate
          >
            <div>
              <label htmlFor='forgot-email'>
                <span>Email</span>
              </label>
              <input
                id='forgot-email'
                name='email'
                type='email'
                placeholder='Enter your email address'
                required
                autoFocus
                data-testid='forgot-email-input'
                aria-label='Email'
              />
            </div>

            <div>
              <button type='submit' data-testid='forgot-password-submit'>
                Send Reset Link
              </button>
            </div>
          </form>

          {/* Navigation back to sign-in */}
          <div>Remember your password?</div>
          <div>
            <a href={PATHS.AUTH.SIGN_IN} data-testid='back-to-sign-in-button'>
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the forgot password route to the app.
 * @param app - Hono app instance
 */
export const buildForgotPassword = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.get(
    PATHS.AUTH.FORGOT_PASSWORD,
    secureHeaders(STANDARD_SECURE_HEADERS),
    (c) => {
      setupNoCacheHeaders(c)
      return c.render(useLayout(c, renderForgotPassword()))
    }
  )
}
