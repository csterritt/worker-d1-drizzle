/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for email confirmation page.
 * @module routes/auth/buildEmailConfirmation
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, COOKIES, STANDARD_SECURE_HEADERS } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { redirectWithMessage } from '../../lib/redirects'
import { retrieveCookie, removeCookie } from '../../lib/cookie-support'
import { createAuth } from '../../lib/auth'

/**
 * Render the JSX for the email confirmation success page.
 * @param message - Success or error message
 * @param isSuccess - Whether the confirmation was successful
 */
const renderEmailConfirmation = (message: string, isSuccess: boolean) => {
  return (
    <div data-testid='email-confirmation-page' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <div
            className={`alert ${isSuccess ? 'alert-success' : 'alert-error'} mb-4`}
          >
            <div>
              <h2 className='font-bold text-lg'>
                {isSuccess ? 'Email Confirmed!' : 'Confirmation Failed'}
              </h2>
              <p>{message}</p>
            </div>
          </div>

          {isSuccess ? (
            <div className='card-actions justify-center'>
              <a
                href={PATHS.AUTH.SIGN_IN}
                className='btn btn-primary'
                data-testid='sign-in-after-confirmation'
              >
                Sign In Now
              </a>
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              <div className='card-actions justify-center'>
                <a
                  href={PATHS.AUTH.SIGN_IN}
                  className='btn btn-primary'
                  data-testid='back-to-sign-in'
                >
                  Back to Sign In
                </a>
              </div>
              <div className='text-center'>
                <p className='text-sm text-gray-600'>
                  Need a new confirmation link? Try signing up again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Render the JSX for the email sent confirmation page.
 * @param email - User's email address
 */
const renderEmailSent = (email: string) => {
  return (
    <div data-testid='email-sent-page' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <div className='alert alert-info mb-4'>
            <div>
              <h2 className='font-bold text-lg'>Check Your Email</h2>
              <p>
                We've sent a confirmation link to <strong>{email}</strong>.
                Please check your email and click the link to verify your
                account.
              </p>
            </div>
          </div>

          <div className='text-center text-sm text-gray-600 mb-4'>
            <p>Didn't receive the email? Check your spam folder.</p>
            <p>The confirmation link will expire in 24 hours.</p>
          </div>

          <div className='card-actions justify-center'>
            <a
              href={PATHS.AUTH.SIGN_IN}
              className='btn btn-ghost'
              data-testid='back-to-sign-in-from-sent'
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
 * Attach the email confirmation routes to the app.
 * @param app - Hono app instance
 */
export const buildEmailConfirmation = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  // Email confirmation endpoint - handles verification tokens
  app.get(
    '/auth/verify-email',
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      setupNoCacheHeaders(c)

      const token = c.req.query('token')
      const callbackUrl = c.req.query('callbackUrl')

      if (!token) {
        return c.render(
          useLayout(
            c,
            renderEmailConfirmation(
              'No verification token provided. Please check your email for the correct link.',
              false
            )
          )
        )
      }

      try {
        // Use better-auth to verify the email token
        const auth = createAuth(c.env)
        const verification = await auth.api.verifyEmail({
          query: { token, callbackURL: callbackUrl },
        })

        if (verification && 'status' in verification && verification.status) {
          return c.render(
            useLayout(
              c,
              renderEmailConfirmation(
                'Your email has been successfully verified! You can now sign in to your account.',
                true
              )
            )
          )
        } else {
          return c.render(
            useLayout(
              c,
              renderEmailConfirmation(
                'The verification link is invalid or has expired. Please try signing up again.',
                false
              )
            )
          )
        }
      } catch (error) {
        console.error('Email verification error:', error)
        return c.render(
          useLayout(
            c,
            renderEmailConfirmation(
              'There was an error verifying your email. Please try again or contact support.',
              false
            )
          )
        )
      }
    }
  )

  // Email sent confirmation page
  app.get('/auth/email-sent', secureHeaders(STANDARD_SECURE_HEADERS), (c) => {
    setupNoCacheHeaders(c)

    const email = retrieveCookie(c, COOKIES.EMAIL_ENTERED)
    if (!email) {
      return redirectWithMessage(
        c,
        PATHS.AUTH.SIGN_IN,
        'Please sign up to continue.'
      )
    }

    // Clear the email cookie after successful retrieval
    removeCookie(c, COOKIES.EMAIL_ENTERED)

    return c.render(useLayout(c, renderEmailSent(email)))
  })
}
