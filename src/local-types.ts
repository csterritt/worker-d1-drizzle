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
