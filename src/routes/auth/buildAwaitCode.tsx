/**
 * Route builder for the await code (OTP entry) page.
 * @module routes/auth/buildAwaitCode
 */
import { Hono, Context } from 'hono'
import { getCookie } from 'hono/cookie'

import { PATHS } from '../../constants'
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { COOKIES } from '../../constants'
import { redirectWithError, redirectWithMessage } from '../../lib/redirects'

/**
 * Render the JSX for the await code page.
 * @param c - Hono context
 * @param emailEntered
 */
const renderAwaitCode = (c: Context, emailEntered: string) => {
  return (
    <div data-testid='await-code-page-banner' className='flex justify-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold mb-4'>Enter Code</h2>
          <form
            method='post'
            action={PATHS.AUTH.FINISH_OTP}
            className='flex flex-col gap-4'
            aria-label='Enter code form'
          >
            <input type='hidden' name='email' value={emailEntered} />
            <div className='form-control w-full'>
              <label className='label' htmlFor='otp'>
                <span
                  className='label-text'
                  data-testid='please-enter-code-message'
                >
                  Please enter the one-time code sent to {emailEntered}
                </span>
              </label>
              <input
                id='otp'
                name='otp'
                type='text'
                inputMode='numeric'
                pattern='[0-9]{6}'
                maxLength={6}
                minLength={6}
                placeholder='6-digit code'
                required
                className='input input-bordered w-full'
                autoFocus
                data-testid='otp-input'
                aria-label={`Please enter the one-time code sent to ${emailEntered}`}
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
                Verify Code
              </button>
            </div>
          </form>

          {/* Resend code form */}
          <div className='divider'>OR</div>
          <form
            method='post'
            action={PATHS.AUTH.RESEND_CODE}
            className='text-center'
            aria-label='Resend code form'
          >
            <input type='hidden' name='email' value={emailEntered} />
            <button
              type='submit'
              className='btn btn-outline btn-secondary'
              data-testid='resend-code-button'
            >
              Resend code
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the await code route to the app.
 * @param app - Hono app instance
 */
export const buildAwaitCode = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(PATHS.AUTH.AWAIT_CODE, (c) => {
    if (c.env.Session == null || c.env.Session.isNothing) {
      return redirectWithError(
        c,
        PATHS.AUTH.SIGN_IN,
        'Sign in flow problem, please sign in again'
      )
    }

    if (c.env.Session.value.signedIn) {
      return redirectWithMessage(c, PATHS.HOME, 'You are already signed in.')
    }

    const emailEntered: string = getCookie(c, COOKIES.EMAIL_ENTERED) ?? ''

    return c.render(useLayout(c, renderAwaitCode(c, emailEntered)))
  })
}
