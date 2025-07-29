import { Context } from 'hono'
import { addCookie } from './cookie-support'

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
  if (message.trim() !== '') {
    addCookie(c, COOKIES.MESSAGE_FOUND, message)
  }

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
  addCookie(c, COOKIES.ERROR_FOUND, errorMessage)
  return c.redirect(redirectUrl, HTML_STATUS.SEE_OTHER)
}
