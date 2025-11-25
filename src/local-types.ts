/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Maybe } from 'true-myth'
import { Context } from 'hono'
import { createDbClient } from './db/client'

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

export interface Bindings {
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
  NODE_ENV?: string
  PLAYWRIGHT?: string
  SMTP_SERVER_HOST?: string
  SMTP_SERVER_PORT?: string
  SMTP_SERVER_USER?: string
  SMTP_SERVER_PASS?: string
}

/**
 * Drizzle database client type
 */
export type DrizzleClient = ReturnType<typeof createDbClient>

/**
 * User data from better-auth session
 */
export interface AuthUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Session data from better-auth
 */
export interface AuthSession {
  id: string
  userId: string
  expiresAt: Date
  token: string
  createdAt: Date
  updatedAt: Date
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Combined auth session response
 */
export interface AuthSessionResponse {
  user: AuthUser
  session: AuthSession
}

/**
 * Variables stored in Hono context
 */
export interface AppVariables {
  db: DrizzleClient
  user?: AuthUser | null
  session?: AuthSession | null
  authSession?: AuthSessionResponse | null
  signInEmail?: string
}

/**
 * Full app environment type
 */
export type AppEnv = { Bindings: Bindings; Variables: AppVariables }

/**
 * Hono context with Bindings and Variables
 */
export type AppContext = Context<AppEnv>

/**
 * Pushover notification message
 */
export interface PushoverMessage {
  token: string
  user: string
  message: string
}

/**
 * HTTP Response type for fetch operations
 */
export interface FetchResponse {
  headers: Headers
  json: () => Promise<unknown>
  text: () => Promise<string>
}

/**
 * Counter with decrement functionality
 * Note: Consider replacing with a functional approach
 */
export class CountAndDecrement {
  count: number = 0

  constructor(initialCount: number) {
    this.count = initialCount
  }

  decrement(): void {
    this.count -= 1
  }
}
