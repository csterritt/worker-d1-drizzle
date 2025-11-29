/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the gated sign-up page.
 * @module routes/auth/buildGatedSignUp
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
 * Render the JSX for the gated sign-up page.
 * @param emailEntered - email entered by user, if any
 */
const renderGatedSignUp = (emailEntered: string) => {
  return (
    <div data-testid='sign-up-page-banner'>
      <div>
        <div>
          <h2>Create Account</h2>
          <p>A sign-up code is required to create an account.</p>

          {/* Gated sign up form */}
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
      return redirectWithMessage(c, PATHS.PRIVATE, MESSAGES.ALREADY_SIGNED_IN)
    }

    const emailEntered: string = retrieveCookie(c, COOKIES.EMAIL_ENTERED) ?? ''

    setupNoCacheHeaders(c)
    return c.render(useLayout(c, renderGatedSignUp(emailEntered)))
  })
}
