/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Provides a layout wrapper for TSX content.
 * @module routes/buildLayout
 */
import { Context } from 'hono'
import type { HtmlEscapedString } from 'hono/utils/html'

import { removeCookie, retrieveCookie } from '../lib/cookie-support'
import { PATHS, COOKIES } from '../constants'
import { version } from '../version'

/**
 * Wraps children in a standard layout.
 * @returns TSX element with layout
 * @param c - Hono context
 * @param children - TSX children
 */
export const useLayout = (
  c: Context,
  children: HtmlEscapedString | Promise<HtmlEscapedString>,
  extraMessage?: string
) => {
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
    <div>
      {/* Responsive navbar */}
      <div>
        <div>
          <div>
            <span>Worker, D1, Drizzle Demo</span>
          </div>
        </div>
        <div>
          {!c.get('user') && (
            <a href={PATHS.AUTH.SIGN_IN} data-testid='sign-in-action'>
              Sign in
            </a>
          )}

          {c.get('user') && (
            <div>
              <span>
                Welcome, {c.get('user')?.name || c.get('user')?.email || 'User'}
                !
              </span>
              <form method='post' action='/auth/sign-out'>
                <button type='submit' data-testid='sign-out-action'>
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Alert messages */}
      {message && (
        <div role='alert'>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div role='alert'>
          <span>{error}</span>
        </div>
      )}

      {/* Main content */}
      <div>{children}</div>

      {/* Footer */}
      <footer>
        <div>
          <p>Copyright &copy; 2025 V-{version}</p>
        </div>
      </footer>
    </div>
  )
}
