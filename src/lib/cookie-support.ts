/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Cookie utility functions
 * @module lib/cookie-support
 */
import { Context } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'

import { COOKIES } from '../constants'

/**
 * Retrieves a cookie value
 * @param c - Hono context
 * @param name - Cookie name
 * @returns Cookie value or undefined if not found
 */
export const retrieveCookie = (
  c: Context,
  name: string
): string | undefined => {
  return getCookie(c, name)
}

/**
 * Sets a cookie with standard cookie options
 * @param c - Hono context
 * @param name - Cookie name
 * @param value - Cookie value
 * @param extraOptions - Additional cookie options
 */
export const addCookie = (
  c: Context,
  name: string,
  value: string,
  extraOptions?: Record<string, unknown>
): void => {
  let options = COOKIES.STANDARD_COOKIE_OPTIONS
  if (extraOptions) {
    options = { ...options, ...extraOptions }
  }

  setCookie(c, name, value, options)
}

/**
 * Sets a cookie without the standard cookie options, so it can be read/deleted
 * by javascript
 * @param c - Hono context
 * @param name - Cookie name
 * @param value - Cookie value
 * @param extraOptions - Additional cookie options
 */
export const addSimpleCookie = (
  c: Context,
  name: string,
  value: string
): void => {
  setCookie(c, name, value, { path: '/' })
}

/**
 * Removes a cookie with standard cookie options
 * @param c - Hono context
 * @param name - Cookie name
 */
export const removeCookie = (c: Context, name: string): void => {
  deleteCookie(c, name, COOKIES.STANDARD_COOKIE_OPTIONS)
}

/**
 * Removes a cookie without the standard cookie options
 * @param c - Hono context
 * @param name - Cookie name
 */
export const removeSimpleCookie = (c: Context, name: string): void => {
  deleteCookie(c, name, { path: '/' })
}
