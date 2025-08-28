/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the sign-in page.
 * @module routes/auth/buildSignIn
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS, SIGN_UP_MODES } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { COOKIES } from '../../constants'
import { redirectWithMessage } from '../../lib/redirects'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { retrieveCookie } from '../../lib/cookie-support'

/**
 * Render the JSX for the sign-in page.
 * @param c - Hono context
 * @param emailEntered - email entered by user, if any
 */
const renderSignIn = (emailEntered: string) => {
  return (
    <div data-testid='sign-in-page-banner' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold mb-4'>Sign In</h2>

          {/* Better-auth sign-in form */}
          <form
            method='post'
            action='/api/auth/sign-in/email'
            className='flex flex-col gap-4'
            aria-label='Sign in form'
          >
            <div className='form-control w-full'>
              <label className='label' htmlFor='email'>
                <span className='label-text'>Email</span>
              </label>
              <input
                id='email'
                name='email'
                type='email'
                placeholder='Enter your email'
                required
                className='input input-bordered w-full'
                autoFocus
                value={emailEntered}
                data-testid='email-input'
                aria-label='Email'
              />
            </div>

            <div className='form-control w-full'>
              <label className='label' htmlFor='password'>
                <span className='label-text'>Password</span>
              </label>
              <input
                id='password'
                name='password'
                type='password'
                placeholder='Enter your password'
                required
                minLength={8}
                className='input input-bordered w-full'
                data-testid='password-input'
                aria-label='Password'
              />
            </div>

            <div className='card-actions justify-end mt-4'>
              <button
                type='submit'
                className='btn btn-primary'
                data-testid='submit'
              >
                Sign In
              </button>
            </div>
          </form>

          {/* Forgot password link */}
          <div className='text-center mt-2'>
            <a
              href={PATHS.AUTH.FORGOT_PASSWORD}
              className='link link-primary text-sm'
              data-testid='forgot-password-link'
            >
              Forgot your password?
            </a>
          </div>

          {/* Navigation to sign-up page - only show if sign-up is enabled */}
          {process.env.SIGN_UP_MODE !== SIGN_UP_MODES.NO_SIGN_UP && (
            <>
              <div className='divider'>New user?</div>
              <div className='card-actions justify-center'>
                <a
                  href={
                    process.env.SIGN_UP_MODE === SIGN_UP_MODES.INTEREST_SIGN_UP
                      ? PATHS.AUTH.INTEREST_SIGN_UP
                      : PATHS.AUTH.SIGN_UP
                  }
                  className='btn btn-outline btn-secondary'
                  data-testid='go-to-sign-up-button'
                >
                  {process.env.SIGN_UP_MODE === SIGN_UP_MODES.INTEREST_SIGN_UP
                    ? 'Join Waitlist'
                    : 'Create Account'}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the sign-in route to the app.
 * @param app - Hono app instance
 */
export const buildSignIn = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(
    `${PATHS.AUTH.SIGN_IN}/:validationSuccessful?`,
    secureHeaders(STANDARD_SECURE_HEADERS),
    (c) => {
      // Check if user is already signed in using better-auth session
      // Better-auth middleware sets user context, access it properly
      const user = (c as any).get('user')
      if (user) {
        console.log('Already signed in')
        return redirectWithMessage(
          c,
          PATHS.PRIVATE,
          'You are already signed in.'
        )
      }

      // Check if sign-in validation was successful
      const validationSuccessful = c.req.param('validationSuccessful')
      let extraMessage = ''
      if (validationSuccessful === 'true') {
        extraMessage =
          'Your email has been verified successfully. You may now sign in.'
      }

      // No need to check for intermediate "signing in" state with better-auth
      // since it's direct username/password authentication
      const emailEntered: string =
        retrieveCookie(c, COOKIES.EMAIL_ENTERED) ?? ''

      setupNoCacheHeaders(c)
      return c.render(useLayout(c, renderSignIn(emailEntered), extraMessage))
    }
  )
}
