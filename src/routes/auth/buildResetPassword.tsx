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
import { useLayout } from '../buildLayout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'

/**
 * Render the JSX for the reset password page.
 * @param token - Reset token from URL
 */
const renderResetPassword = (token: string) => {
  return (
    <div data-testid='reset-password-page' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold mb-4'>
            Set New Password
          </h2>

          <p className='text-sm text-gray-600 mb-4'>
            Enter your new password below. Make sure it's at least 8 characters
            long.
          </p>

          {/* Reset password form */}
          <form
            method='post'
            action='/auth/reset-password'
            className='flex flex-col gap-4'
            aria-label='Reset password form'
            noValidate
          >
            {/* Hidden token field */}
            <input type='hidden' name='token' value={token} />

            <div className='form-control w-full'>
              <label className='label' htmlFor='new-password'>
                <span className='label-text'>New Password</span>
              </label>
              <input
                id='new-password'
                name='password'
                type='password'
                placeholder='Enter your new password'
                required
                minLength={8}
                className='input input-bordered w-full'
                autoFocus
                data-testid='new-password-input'
                aria-label='New Password'
              />
            </div>

            <div className='form-control w-full'>
              <label className='label' htmlFor='confirm-password'>
                <span className='label-text'>Confirm New Password</span>
              </label>
              <input
                id='confirm-password'
                name='confirmPassword'
                type='password'
                placeholder='Confirm your new password'
                required
                minLength={8}
                className='input input-bordered w-full'
                data-testid='confirm-password-input'
                aria-label='Confirm Password'
              />
            </div>

            <div className='card-actions justify-end mt-4'>
              <button
                type='submit'
                className='btn btn-primary w-full'
                data-testid='reset-password-submit'
              >
                Update Password
              </button>
            </div>
          </form>

          {/* Navigation back to sign-in */}
          <div className='divider'>Remember your password?</div>
          <div className='card-actions justify-center'>
            <a
              href={PATHS.AUTH.SIGN_IN}
              className='btn btn-outline btn-secondary'
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
    <div data-testid='invalid-token-page' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <div className='alert alert-error mb-4'>
            <div>
              <h2 className='font-bold text-lg'>Invalid Reset Link</h2>
              <p>
                This password reset link is invalid or has expired. Please
                request a new password reset link.
              </p>
            </div>
          </div>

          <div className='card-actions justify-center'>
            <a
              href={PATHS.AUTH.FORGOT_PASSWORD}
              className='btn btn-primary'
              data-testid='request-new-reset-link'
            >
              Request New Reset Link
            </a>
          </div>

          <div className='divider'>Or</div>
          <div className='card-actions justify-center'>
            <a
              href={PATHS.AUTH.SIGN_IN}
              className='btn btn-outline btn-secondary'
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
