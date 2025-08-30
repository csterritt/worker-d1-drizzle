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
    <div data-testid='forgot-password-page' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold mb-4'>
            Reset Your Password
          </h2>

          <p className='text-sm text-gray-600 mb-4'>
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          {/* Forgot password form */}
          <form
            method='post'
            action='/auth/forgot-password'
            className='flex flex-col gap-4'
            aria-label='Forgot password form'
            noValidate
          >
            <div className='form-control w-full'>
              <label className='label' htmlFor='forgot-email'>
                <span className='label-text'>Email</span>
              </label>
              <input
                id='forgot-email'
                name='email'
                type='email'
                placeholder='Enter your email address'
                required
                className='input input-bordered w-full'
                autoFocus
                data-testid='forgot-email-input'
                aria-label='Email'
              />
            </div>

            <div className='card-actions justify-end mt-4'>
              <button
                type='submit'
                className='btn btn-primary w-full'
                data-testid='forgot-password-submit'
              >
                Send Reset Link
              </button>
            </div>
          </form>

          {/* Navigation back to sign-in */}
          <div className='divider'>Remember your password?</div>
          <div className='card-actions justify-center'>
            <a
              href={PATHS.AUTH.SIGN_IN}
              className='btn btn-outline btn-secondary'
              data-testid='back-to-sign-in-button'
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
