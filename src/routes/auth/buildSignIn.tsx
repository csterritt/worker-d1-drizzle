/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the sign-in page.
 * @module routes/auth/buildSignIn
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import {
  PATHS,
  STANDARD_SECURE_HEADERS,
  SIGN_UP_MODES,
  MESSAGES,
  UI_TEXT,
} from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { COOKIES } from '../../constants'
import { redirectWithMessage } from '../../lib/redirects'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { retrieveCookie } from '../../lib/cookie-support'
import {
  validateRequest,
  PathSignInValidationParamSchema,
} from '../../lib/validators'

/**
 * Render the JSX for the sign-in page.
 * @param c - Hono context
 * @param emailEntered - email entered by user, if any
 */
const renderSignIn = (emailEntered: string) => {
  return (
    <div data-testid='sign-in-page-banner'>
      <div>
        <div>
          <h2>Sign In</h2>

          {/* Better-auth sign-in form */}
          <form
            method='post'
            action={PATHS.AUTH.SIGN_IN_EMAIL_API}
            aria-label='Sign in form'
          >
            <div>
              <label htmlFor='email'>
                <span>Email</span>
              </label>
              <input
                id='email'
                name='email'
                type='email'
                placeholder={UI_TEXT.ENTER_YOUR_EMAIL}
                required
                autoFocus
                value={emailEntered}
                data-testid='email-input'
                aria-label='Email'
              />
            </div>

            <div>
              <label htmlFor='password'>
                <span>Password</span>
              </label>
              <input
                id='password'
                name='password'
                type='password'
                placeholder='Enter your password'
                required
                minLength={8}
                data-testid='password-input'
                aria-label='Password'
              />
            </div>

            <div>
              <button type='submit' data-testid='submit'>
                Sign In
              </button>
            </div>
          </form>

          {/* Forgot password link */}
          <div>
            <a
              href={PATHS.AUTH.FORGOT_PASSWORD}
              data-testid='forgot-password-action'
            >
              Forgot your password?
            </a>
          </div>

          {/* Navigation to sign-up page - only show if sign-up is enabled */}
          {process.env.SIGN_UP_MODE !== SIGN_UP_MODES.NO_SIGN_UP && (
            <>
              <div>New user?</div>
              <div>
                <a
                  href={
                    process.env.SIGN_UP_MODE === SIGN_UP_MODES.INTEREST_SIGN_UP
                      ? PATHS.AUTH.INTEREST_SIGN_UP
                      : PATHS.AUTH.SIGN_UP
                  }
                  data-testid='go-to-sign-up-action'
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
        return redirectWithMessage(c, PATHS.PRIVATE, MESSAGES.ALREADY_SIGNED_IN)
      }

      // Validate optional path flag :validationSuccessful
      const [okParams, paramData, _paramErr] = validateRequest(
        { validationSuccessful: c.req.param('validationSuccessful') },
        PathSignInValidationParamSchema
      )
      let extraMessage = ''
      if (okParams && paramData?.validationSuccessful === 'true') {
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
