/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the sign-up page.
 * @module routes/auth/buildSignUp
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
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
    <div data-testid='sign-up-page-banner' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold mb-4'>Create Account</h2>

          {/* Sign up form */}
          <form
            method='post'
            action='/auth/sign-up'
            className='flex flex-col gap-4'
            aria-label='Sign up form'
          >
            <div className='form-control w-full'>
              <label className='label' htmlFor='signup-name'>
                <span className='label-text'>Name</span>
              </label>
              <input
                id='signup-name'
                name='name'
                type='text'
                placeholder='Enter your name'
                required
                className='input input-bordered w-full'
                autoFocus
                data-testid='signup-name-input'
                aria-label='Name'
              />
            </div>

            <div className='form-control w-full'>
              <label className='label' htmlFor='signup-email'>
                <span className='label-text'>Email</span>
              </label>
              <input
                id='signup-email'
                name='email'
                type='email'
                placeholder='Enter your email'
                required
                className='input input-bordered w-full'
                value={emailEntered}
                data-testid='signup-email-input'
                aria-label='Email'
              />
            </div>

            <div className='form-control w-full'>
              <label className='label' htmlFor='signup-password'>
                <span className='label-text'>Password</span>
              </label>
              <input
                id='signup-password'
                name='password'
                type='password'
                placeholder='Enter your password (min 8 characters)'
                required
                minLength={8}
                className='input input-bordered w-full'
                data-testid='signup-password-input'
                aria-label='Password'
              />
            </div>

            <div className='card-actions justify-end mt-4'>
              <button
                type='submit'
                className='btn btn-primary w-full'
                data-testid='signup-submit'
              >
                Create Account
              </button>
            </div>
          </form>

          {/* Navigation to sign-in page */}
          <div className='divider'>Already have an account?</div>
          <div className='card-actions justify-center'>
            <a
              href={PATHS.AUTH.SIGN_IN}
              className='btn btn-outline btn-secondary'
              data-testid='go-to-sign-in-button'
            >
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
      return redirectWithMessage(c, PATHS.PRIVATE, 'You are already signed in.')
    }

    const emailEntered: string = retrieveCookie(c, COOKIES.EMAIL_ENTERED) ?? ''

    setupNoCacheHeaders(c)
    return c.render(useLayout(c, renderSignUp(emailEntered)))
  })
}
