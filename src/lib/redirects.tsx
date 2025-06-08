import { Context } from 'hono'
import { setCookie } from 'hono/cookie'

import { COOKIES, HTML_STATUS } from '../constants'

/**
 * Helper function to redirect with a message cookie
 * @param c - Hono context
 * @param redirectUrl - URL to redirect to
 * @param message - The message to display
 * @returns Response object with redirect and cookie
 */
export function redirectWithMessage(
  c: Context,
  redirectUrl: string,
  message: string
): Response {
  setCookie(c, COOKIES.MESSAGE_FOUND, message, COOKIES.STANDARD_COOKIE_OPTIONS)
  return c.redirect(redirectUrl, HTML_STATUS.SEE_OTHER)
}

/**
 * Helper function to redirect with an error cookie
 * @param c - Hono context
 * @param redirectUrl - URL to redirect to
 * @param errorMessage - The error message to display
 * @returns Response object with redirect and cookie
 */
export function redirectWithError(
  c: Context,
  redirectUrl: string,
  errorMessage: string
): Response {
  setCookie(
    c,
    COOKIES.ERROR_FOUND,
    errorMessage,
    COOKIES.STANDARD_COOKIE_OPTIONS
  )
  return c.redirect(redirectUrl, HTML_STATUS.SEE_OTHER)
}
