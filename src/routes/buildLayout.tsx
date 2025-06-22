/**
 * Provides a layout wrapper for TSX content.
 * @module routes/buildLayout
 */
import { Context } from 'hono'
import { getCookie, deleteCookie } from 'hono/cookie'

import { PATHS, COOKIES } from '../constants'
import { version } from '../version'

/**
 * Wraps children in a standard layout.
 * @returns TSX element with layout
 * @param c - Hono context
 * @param children - TSX children
 */
export const useLayout = (c: Context, children: any) => {
  // Get message and error cookies
  const message = getCookie(c, COOKIES.MESSAGE_FOUND)
  if (message) {
    deleteCookie(c, COOKIES.MESSAGE_FOUND)
  }
  const error = getCookie(c, COOKIES.ERROR_FOUND)
  if (error) {
    deleteCookie(c, COOKIES.ERROR_FOUND)
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
          {(c.env.Session.isNothing || !c.env.Session.value.signedIn) && (
            <a
              href={PATHS.AUTH.SIGN_IN}
              className='btn btn-primary btn-sm mx-2'
              data-testid='sign-in-link'
            >
              Sign in
            </a>
          )}

          {c.env.Session.isJust && c.env.Session.value.signedIn && (
            <form method='post' action={PATHS.AUTH.SIGN_OUT}>
              <button
                type='submit'
                className='btn btn-ghost btn-sm mx-2'
                data-testid='sign-out-link'
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Alert messages */}
      {message && (
        <div
          className='alert alert-success shadow-lg max-w-md mx-auto mt-4'
          role='alert'
        >
          <div>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='stroke-current flex-shrink-0 h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <span>{message}</span>
          </div>
        </div>
      )}

      {error && (
        <div
          className='alert alert-error shadow-lg max-w-md mx-auto mt-4'
          role='alert'
        >
          <div>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='stroke-current flex-shrink-0 h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <span>{error}</span>
          </div>
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
