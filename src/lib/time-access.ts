/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Context } from 'hono'

import { addCookie, removeCookie, retrieveCookie } from './cookie-support'

/**
 * Returns the current time as a Date object. Use this instead of calling new Date() directly.
 * Optionally, pass arguments to forward to Date constructor.
 * @module lib/time-access
 */

export const getCurrentTime = (
  c: Context,
  ...args: (string | number | Date)[]
): Date => {
  // if (args.length === 0) { // PRODUCTION:UNCOMMENT
  //   return new Date() // PRODUCTION:UNCOMMENT
  // } // PRODUCTION:UNCOMMENT

  // // @ts-ignore // PRODUCTION:UNCOMMENT
  // return new Date(...args) // PRODUCTION:UNCOMMENT
  // } // PRODUCTION:UNCOMMENT
  // PRODUCTION:STOP

  const ds = retrieveCookie(c, 'delta')
  const delta = parseInt(ds == null || ds.toString().trim() === '' ? '0' : ds)
  if (args.length === 0) {
    return new Date(new Date().getTime() + delta)
  }

  // @ts-ignore
  return new Date(new Date(...args).getTime() + delta)
}

export const setCurrentDelta = (c: Context, delta: number): void => {
  addCookie(c, 'delta', String(delta))
}

export const clearCurrentDelta = (c: Context): void => {
  removeCookie(c, 'delta')
}
