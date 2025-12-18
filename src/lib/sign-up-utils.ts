/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Shared utilities for sign-up handlers.
 * @module lib/sign-up-utils
 */
import { Context } from 'hono'

import { redirectWithMessage } from './redirects'
import { addCookie } from './cookie-support'
import { getUserIdByEmail, updateAccountTimestamp } from './db-access'
import {
  PATHS,
  COOKIES,
  MESSAGES,
  LOG_MESSAGES,
  HTML_STATUS,
} from '../constants'
import type { Bindings, DrizzleClient } from '../local-types'

/**
 * Patterns that indicate a duplicate email error
 */
const DUPLICATE_EMAIL_PATTERNS = [
  'already exists',
  'duplicate',
  'unique constraint',
  'unique',
  'violates unique',
]

/**
 * Patterns that indicate a database constraint error (likely duplicate)
 */
const CONSTRAINT_ERROR_PATTERNS = ['constraint', 'sqlite_constraint']

/**
 * Check if an error message indicates a duplicate email
 * @param errorMessage - Error message to check
 * @returns True if the error indicates a duplicate email
 */
export const isDuplicateEmailError = (errorMessage: string): boolean => {
  const lowerMessage = errorMessage.toLowerCase()

  const hasDuplicatePattern = DUPLICATE_EMAIL_PATTERNS.some((pattern) =>
    lowerMessage.includes(pattern)
  )

  const hasEmailExists =
    lowerMessage.includes('email') && lowerMessage.includes('exists')

  return hasDuplicatePattern || hasEmailExists
}

/**
 * Check if an error message indicates a database constraint error
 * @param errorMessage - Error message to check
 * @returns True if the error indicates a constraint violation
 */
export const isConstraintError = (errorMessage: string): boolean => {
  const lowerMessage = errorMessage.toLowerCase()
  return CONSTRAINT_ERROR_PATTERNS.some((pattern) =>
    lowerMessage.includes(pattern)
  )
}

/**
 * Extract error message from an unknown error
 * @param error - Unknown error value
 * @returns String error message
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

/**
 * Handle sign-up API response errors
 * @param c - Hono context
 * @param response - Sign-up API response
 * @param email - User email for cookie
 * @param fallbackPath - Path to redirect on generic error
 * @returns Response if error handled, null if no error
 */
export const handleSignUpResponseError = (
  c: Context<{ Bindings: Bindings }>,
  response: unknown,
  email: string,
  fallbackPath: string
): Response | null => {
  if (
    typeof response !== 'object' ||
    response === null ||
    !('error' in response)
  ) {
    return null
  }

  const responseWithError = response as { error?: { message?: string } }
  const errorMessage = responseWithError.error?.message || 'Registration failed'
  console.log('Better-auth error response:', errorMessage)

  if (isDuplicateEmailError(errorMessage)) {
    addCookie(c, COOKIES.EMAIL_ENTERED, email)
    return redirectWithMessage(
      c,
      PATHS.AUTH.AWAIT_VERIFICATION,
      MESSAGES.ACCOUNT_ALREADY_EXISTS
    )
  }

  return redirectWithMessage(
    c,
    fallbackPath,
    `Registration failed: ${errorMessage}`
  )
}

/**
 * Handle sign-up API exceptions
 * @param c - Hono context
 * @param error - Caught error
 * @param email - User email for cookie
 * @param fallbackPath - Path to redirect on generic error
 * @returns Response
 */
export const handleSignUpApiError = (
  c: Context<{ Bindings: Bindings }>,
  error: unknown,
  email: string,
  fallbackPath: string
): Response => {
  console.error('Better-auth sign-up API error:', error)

  const errorMessage = extractErrorMessage(error)

  if (isDuplicateEmailError(errorMessage) || isConstraintError(errorMessage)) {
    addCookie(c, COOKIES.EMAIL_ENTERED, email)
    return redirectWithMessage(
      c,
      PATHS.AUTH.AWAIT_VERIFICATION,
      MESSAGES.ACCOUNT_ALREADY_EXISTS
    )
  }

  return redirectWithMessage(
    c,
    fallbackPath,
    MESSAGES.REGISTRATION_GENERIC_ERROR
  )
}

/**
 * Update account timestamp after successful sign-up
 * @param db - Database client
 * @param email - User email to find
 */
export const updateAccountTimestampAfterSignUp = async (
  db: DrizzleClient,
  email: string
): Promise<void> => {
  try {
    const userIdResult = await getUserIdByEmail(db, email)

    if (userIdResult.isOk && userIdResult.value.length > 0) {
      const updateResult = await updateAccountTimestamp(
        db,
        userIdResult.value[0].id
      )

      if (updateResult.isErr) {
        console.error(LOG_MESSAGES.DB_UPDATE_ACCOUNT_TS, updateResult.error)
      }
    }
  } catch (dbError) {
    console.error('Error updating account timestamp:', dbError)
  }
}

/**
 * Redirect to await verification page with email cookie
 * @param c - Hono context
 * @param email - User email for cookie
 * @returns Redirect response
 */
export const redirectToAwaitVerification = (
  c: Context,
  email: string
): Response => {
  addCookie(c, COOKIES.EMAIL_ENTERED, email)
  return c.redirect(PATHS.AUTH.AWAIT_VERIFICATION, HTML_STATUS.SEE_OTHER)
}
