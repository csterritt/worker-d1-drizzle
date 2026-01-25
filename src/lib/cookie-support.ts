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
import { Bindings } from '../local-types'

/**
 * Retrieves a cookie value
 * @param c - Hono context
 * @param name - Cookie name
 * @returns Cookie value or undefined if not found
 */
export const retrieveCookie = <E extends { Bindings: Bindings }>(
  c: Context<E, any, any>,
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
export const addCookie = <E extends { Bindings: Bindings }>(
  c: Context<E, any, any>,
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
 * Removes a cookie with standard cookie options
 * @param c - Hono context
 * @param name - Cookie name
 */
export const removeCookie = <E extends { Bindings: Bindings }>(
  c: Context<E, any, any>,
  name: string
): void => {
  deleteCookie(c, name, COOKIES.STANDARD_COOKIE_OPTIONS)
}
