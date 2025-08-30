/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the gated sign-up page.
 * @module routes/auth/buildGatedSignUp
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
 * Render the JSX for the gated sign-up page.
 * @param emailEntered - email entered by user, if any
 */
const renderGatedSignUp = (emailEntered: string) => {
  return (
    <div
      data-testid='gated-sign-up-page-banner'
      className='flex justify-center'
    >
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold mb-4'>Create Account</h2>
          <p className='text-sm text-base-content/70 mb-4'>
            A sign-up code is required to create an account.
          </p>

          {/* Gated sign up form */}
          <form
            method='post'
            action='/auth/sign-up'
            className='flex flex-col gap-4'
            aria-label='Gated sign up form'
            noValidate
          >
            <div className='form-control w-full'>
              <label className='label' htmlFor='gated-signup-code'>
                <span className='label-text'>Sign-up Code *</span>
              </label>
              <input
                id='gated-signup-code'
                name='code'
                type='text'
                placeholder='Enter your sign-up code'
                required
                className='input input-bordered w-full'
                autoFocus
                data-testid='gated-signup-code-input'
                aria-label='Sign-up Code'
              />
            </div>

            <div className='form-control w-full'>
              <label className='label' htmlFor='gated-signup-name'>
                <span className='label-text'>Name *</span>
              </label>
              <input
                id='gated-signup-name'
                name='name'
                type='text'
                placeholder='Enter your name'
                required
                className='input input-bordered w-full'
                data-testid='gated-signup-name-input'
                aria-label='Name'
              />
            </div>

            <div className='form-control w-full'>
              <label className='label' htmlFor='gated-signup-email'>
                <span className='label-text'>Email *</span>
              </label>
              <input
                id='gated-signup-email'
                name='email'
                type='email'
                placeholder='Enter your email'
                required
                className='input input-bordered w-full'
                value={emailEntered}
                data-testid='gated-signup-email-input'
                aria-label='Email'
              />
            </div>

            <div className='form-control w-full'>
              <label className='label' htmlFor='gated-signup-password'>
                <span className='label-text'>Password *</span>
              </label>
              <input
                id='gated-signup-password'
                name='password'
                type='password'
                placeholder='Enter your password (min 8 characters)'
                required
                minLength={8}
                className='input input-bordered w-full'
                data-testid='gated-signup-password-input'
                aria-label='Password'
              />
            </div>

            <div className='card-actions justify-end mt-4'>
              <button
                type='submit'
                className='btn btn-primary w-full'
                data-testid='gated-signup-submit'
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
 * Attach the gated sign-up route to the app.
 * @param app - Hono app instance
 */
export const buildGatedSignUp = (app: Hono<{ Bindings: Bindings }>): void => {
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
    return c.render(useLayout(c, renderGatedSignUp(emailEntered)))
  })
}
