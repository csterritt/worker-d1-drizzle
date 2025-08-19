/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Provides a layout wrapper for TSX content.
 * @module routes/buildLayout
 */
import { Context } from 'hono'

import { removeCookie, retrieveCookie } from '../lib/cookie-support'
import { PATHS, COOKIES } from '../constants'
import { version } from '../version'

/**
 * Wraps children in a standard layout.
 * @returns TSX element with layout
 * @param c - Hono context
 * @param children - TSX children
 */
export const useLayout = (c: Context, children: any, extraMessage?: string) => {
  // Get message and error cookies
  const message = retrieveCookie(c, COOKIES.MESSAGE_FOUND) || extraMessage
  if (message) {
    removeCookie(c, COOKIES.MESSAGE_FOUND)
  }
  const error = retrieveCookie(c, COOKIES.ERROR_FOUND)
  if (error) {
    removeCookie(c, COOKIES.ERROR_FOUND)
  }

  // Set content type header
  c.header('Content-Type', 'text/html; charset=utf-8')

  return (
    <div className='min-h-screen flex flex-col bg-base-100 text-base-content'>
      {/* Responsive navbar */}
      <div className='navbar bg-base-200 shadow-md'>
        <div className='navbar-start'>
          <div className='px-2 mx-2'>
            <span className='text-lg font-bold'>Worker, D1, Drizzle Demo</span>
          </div>
        </div>
        <div className='navbar-end flex items-center'>
          {!c.get('user') && (
            <a
              href={PATHS.AUTH.SIGN_IN}
              className='btn btn-primary btn-sm mx-2'
              data-testid='sign-in-link'
            >
              Sign in
            </a>
          )}

          {c.get('user') && (
            <div className='flex flex-row items-center space-x-4'>
              <span className='text-sm mr-2'>
                Welcome, {c.get('user')?.name || c.get('user')?.email || 'User'}
                !
              </span>
              <form method='post' action='/auth/sign-out'>
                <button
                  type='submit'
                  className='btn btn-ghost btn-sm'
                  data-testid='sign-out-link'
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Alert messages */}
      {message && (
        <div className='alert alert-success mx-auto mt-4' role='alert'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6 shrink-0 stroke-current'
            fill='none'
            viewBox='0 0 24 24'
          >
            <path
              stroke-linecap='round'
              stroke-linejoin='round'
              stroke-width='2'
              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span className='align-middle'>{message}</span>
        </div>
      )}

      {error && (
        <div className='alert alert-error mx-auto mt-4' role='alert'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6 shrink-0 stroke-current'
            fill='none'
            viewBox='0 0 24 24'
          >
            <path
              stroke-linecap='round'
              stroke-linejoin='round'
              stroke-width='2'
              d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span className='align-middle'>{error}</span>
        </div>
      )}

      {/* Main content */}
      <div className='flex-grow container mx-auto px-4 py-8'>{children}</div>

      {/* Footer */}
      <footer className='footer footer-center p-4 bg-base-200 text-base-content'>
        <div>
          <p>Copyright &copy; 2025 V-{version}</p>
        </div>
      </footer>
    </div>
  )
}
