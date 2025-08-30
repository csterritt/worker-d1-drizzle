/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the interest sign-up page.
 * @module routes/auth/buildInterestSignUp
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
 * Render the JSX for the interest sign-up page.
 * @param emailEntered - email entered by user, if any
 */
const renderInterestSignUp = (emailEntered: string) => {
  return (
    <div
      data-testid='interest-sign-up-page-banner'
      className='flex justify-center'
    >
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold mb-4'>
            Join the Waitlist
          </h2>

          <div className='mb-4'>
            <p className='text-base-content/80 text-sm leading-relaxed'>
              We're not accepting new accounts at the moment, but we'd love to
              notify you when we are! Enter your email address to join our
              waitlist.
            </p>
          </div>

          {/* Interest sign-up form */}
          <form
            method='post'
            action={PATHS.AUTH.INTEREST_SIGN_UP}
            className='flex flex-col gap-4'
            aria-label='Interest sign up form'
            noValidate
          >
            <div className='form-control w-full'>
              <label className='label' htmlFor='interest-email'>
                <span className='label-text'>Email Address</span>
              </label>
              <input
                id='interest-email'
                name='email'
                type='email'
                placeholder='Enter your email address'
                required
                className='input input-bordered w-full'
                autoFocus
                value={emailEntered}
                data-testid='interest-email-input'
                aria-label='Email'
              />
            </div>

            <div className='card-actions justify-end mt-4'>
              <button
                type='submit'
                className='btn btn-primary w-full'
                data-testid='interest-submit'
              >
                Join Waitlist
              </button>
            </div>
          </form>

          {/* Navigation back to sign-in page */}
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
 * Attach the interest sign-up route to the app.
 * @param app - Hono app instance
 */
export const buildInterestSignUp = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.get(
    PATHS.AUTH.INTEREST_SIGN_UP,
    secureHeaders(STANDARD_SECURE_HEADERS),
    (c) => {
      // Check if user is already signed in using better-auth session
      const user = (c as any).get('user')
      if (user) {
        console.log('Already signed in')
        return redirectWithMessage(
          c,
          PATHS.PRIVATE,
          'You are already signed in.'
        )
      }

      const emailEntered: string =
        retrieveCookie(c, COOKIES.EMAIL_ENTERED) ?? ''

      setupNoCacheHeaders(c)
      return c.render(useLayout(c, renderInterestSignUp(emailEntered)))
    }
  )
}
