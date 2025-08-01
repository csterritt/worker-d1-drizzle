/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export const generateToken = async () => {
  // Generate a random 6-digit code not starting with zero
  let sessionToken: string = ''
  // PRODUCTION:REMOVE-NEXT-LINE
  while (
    sessionToken === '' || // PRODUCTION:REMOVE
    sessionToken === '123456' || // PRODUCTION:REMOVE
    sessionToken === '999999' // PRODUCTION:REMOVE
    // PRODUCTION:REMOVE-NEXT-LINE
  ) {
    sessionToken = String(Math.floor(100_000 + Math.random() * 900_000))
    // PRODUCTION:REMOVE-NEXT-LINE
  }

  return sessionToken
}
