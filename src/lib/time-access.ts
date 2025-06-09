import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

/**
 * Returns the current time as a Date object. Use this instead of calling new Date() directly.
 * Optionally, pass arguments to forward to Date constructor.
 * @module lib/time-access
 */

export const getCurrentTime = (c: any, ...args: any[]): Date => {
  // if (args.length === 0) { // PRODUCTION:UNCOMMENT
  //   return new Date() // PRODUCTION:UNCOMMENT
  // } // PRODUCTION:UNCOMMENT

  // // @ts-ignore // PRODUCTION:UNCOMMENT
  // return new Date(...args) // PRODUCTION:UNCOMMENT
  // } // PRODUCTION:UNCOMMENT
  // PRODUCTION:STOP

  const ds = getCookie(c, 'delta')
  const delta = parseInt(ds == null || ds.toString().trim() === '' ? '0' : ds)
  if (args.length === 0) {
    return new Date(new Date().getTime() + delta)
  }

  // @ts-ignore
  return new Date(new Date(...args).getTime() + delta)
}

export const setCurrentDelta = (c: any, delta: number) => {
  setCookie(c, 'delta', String(delta), { path: '/' })
}

export const clearCurrentDelta = (c: any) => {
  deleteCookie(c, 'delta', { path: '/' })
}
