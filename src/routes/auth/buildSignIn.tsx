/**
 * Route builder for the sign-in page.
 * @module routes/auth/buildSignIn
 */
import { Hono, Context } from 'hono'
import { getCookie } from 'hono/cookie'

import { PATHS } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { COOKIES } from '../../constants'
import { redirectWithMessage } from '../../lib/redirects'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { reloadOnBackButton } from '../../lib/reload-on-back-button'

/**
 * Render the JSX for the sign-in page.
 * @param c - Hono context
 * @param emailEntered - email entered by user, if any
 */
const renderSignIn = (c: Context, emailEntered: string) => {
  return (
    <div data-testid='sign-in-page-banner' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold mb-4'>Sign In</h2>
          <form
            method='post'
            action={PATHS.AUTH.START_OTP}
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
            <div className='card-actions justify-between mt-4'>
              <a
                href={PATHS.AUTH.CANCEL_OTP}
                className='btn btn-ghost'
                data-testid='cancel-sign-in-link'
              >
                Cancel
              </a>

              <button
                type='submit'
                className='btn btn-primary'
                data-testid='submit'
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
      {reloadOnBackButton()}
    </div>
  )
}

/**
 * Attach the sign-in route to the app.
 * @param app - Hono app instance
 */
export const buildSignIn = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(PATHS.AUTH.SIGN_IN, (c) => {
    if (c.env.Session.isJust && c.env.Session.value.signedIn === true) {
      console.log('Already signed in')
      return redirectWithMessage(c, PATHS.HOME, 'You are already signed in.')
    }

    if (c.env.Session.isJust && c.env.Session.value.signedIn !== true) {
      console.log('Already in the process of signing in')
      return redirectWithMessage(c, PATHS.AUTH.AWAIT_CODE, '')
    }

    const emailEntered: string = getCookie(c, COOKIES.EMAIL_ENTERED) ?? ''

    setupNoCacheHeaders(c)
    return c.render(useLayout(c, renderSignIn(c, emailEntered)))
  })
}
