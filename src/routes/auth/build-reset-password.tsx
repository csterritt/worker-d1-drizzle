/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the reset password page.
 * @module routes/auth/buildResetPassword
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../build-layout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'

/**
 * Render the JSX for the reset password page.
 * @param token - Reset token from URL
 */
const renderResetPassword = (token: string) => {
  return (
    <div data-testid='reset-password-page'>
      <div>
        <div>
          <h2>Set New Password</h2>

          <p>
            Enter your new password below. Make sure it's at least 8 characters
            long.
          </p>

          {/* Reset password form */}
          <form
            method='post'
            action='/auth/reset-password'
            aria-label='Reset password form'
            noValidate
          >
            {/* Hidden token field */}
            <input type='hidden' name='token' value={token} />

            <div>
              <label htmlFor='new-password'>
                <span>New Password</span>
              </label>
              <input
                id='new-password'
                name='password'
                type='password'
                placeholder='Enter your new password'
                required
                minLength={8}
                autoFocus
                data-testid='new-password-input'
                aria-label='New Password'
              />
            </div>

            <div>
              <label htmlFor='confirm-password'>
                <span>Confirm New Password</span>
              </label>
              <input
                id='confirm-password'
                name='confirmPassword'
                type='password'
                placeholder='Confirm your new password'
                required
                minLength={8}
                data-testid='confirm-password-input'
                aria-label='Confirm Password'
              />
            </div>

            <div>
              <button type='submit' data-testid='reset-password-action'>
                Update Password
              </button>
            </div>
          </form>

          {/* Navigation back to sign-in */}
          <div>Remember your password?</div>
          <div>
            <a
              href={PATHS.AUTH.SIGN_IN}
              data-testid='back-to-sign-in-from-reset'
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Render the JSX for invalid/expired token page.
 */
const renderInvalidToken = () => {
  return (
    <div data-testid='invalid-token-page'>
      <div>
        <div>
          <div>
            <div>
              <h2>Invalid Reset Link</h2>
              <p>
                This password reset link is invalid or has expired. Please
                request a new password reset link.
              </p>
            </div>
          </div>

          <div>
            <a
              href={PATHS.AUTH.FORGOT_PASSWORD}
              data-testid='request-new-reset-action'
            >
              Request New Reset Link
            </a>
          </div>

          <div>Or</div>
          <div>
            <a
              href={PATHS.AUTH.SIGN_IN}
              data-testid='back-to-sign-in-from-invalid'
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the reset password route to the app.
 * @param app - Hono app instance
 */
export const buildResetPassword = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(
    PATHS.AUTH.RESET_PASSWORD,
    secureHeaders(STANDARD_SECURE_HEADERS),
    (c) => {
      setupNoCacheHeaders(c)

      const token = c.req.query('token')
      if (!token) {
        return c.render(useLayout(c, renderInvalidToken()))
      }

      return c.render(useLayout(c, renderResetPassword(token)))
    }
  )
}
