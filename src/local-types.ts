/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Maybe } from 'true-myth'

export type SignInSession = {
  id: string
  token: string
  userId: string
  signedIn: boolean
  attemptCount: number
  createdAt: number
  updatedAt: number
  expiresAt: number
}

export type Bindings = {
  PROJECT_DB: D1Database
  Session: Maybe<SignInSession>
  MAGIC_CODE?: string
  UPLOAD_URL?: string
  db?: string
  signUpType?: string
  SIGN_UP_MODE?: string
  EMAIL_SEND_URL?: string
  EMAIL_SEND_CODE?: string
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_DATABASE_ID?: string
  CLOUDFLARE_D1_TOKEN?: string
  PO_APP_ID?: string
  PO_USER_ID?: string
  ALTERNATE_ORIGIN?: string
  BETTER_AUTH_SECRET?: string
}

export class CountAndDecrement {
  count: number = 0

  constructor(initialCount: number) {
    this.count = initialCount
  }

  decrement(): void {
    this.count -= 1
  }
}
