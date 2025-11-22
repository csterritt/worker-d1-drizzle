/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Validation schemas for API requests using Valibot.
 * @module lib/validators
 */
import {
  string,
  object,
  safeParse,
  minLength,
  maxLength,
  pipe,
  custom,
  forward,
  check,
  type BaseSchema,
  type BaseIssue,
  type InferOutput,
} from 'valibot'
import { VALIDATION } from '../constants'

// Email validation function
const validateEmail = (value: unknown) => {
  if (typeof value !== 'string') return false
  return VALIDATION.EMAIL_PATTERN.test(value)
}

/**
 * Email validation schema
 * - Must be a string
 * - Between 1 and 254 characters (standard email length limits)
 * - Must match email regex pattern
 */
export const EmailSchema = pipe(
  string(VALIDATION.REQUIRED),
  minLength(1, VALIDATION.REQUIRED),
  maxLength(254, VALIDATION.EMAIL_INVALID),
  custom(validateEmail, VALIDATION.EMAIL_INVALID)
)

/**
 * Password validation schema
 * - Must be a string
 * - At least 8 characters long
 */
export const PasswordSchema = pipe(
  string(VALIDATION.REQUIRED),
  minLength(8, 'Password must be at least 8 characters long.')
)

/**
 * Sign Up validation schema
 */
export const SignUpSchema = object({
  name: pipe(string(VALIDATION.REQUIRED), minLength(1, VALIDATION.REQUIRED)),
  email: EmailSchema,
  password: PasswordSchema,
})

/**
 * Sign In validation schema
 */
export const SignInSchema = object({
  email: EmailSchema,
  password: pipe(
    string(VALIDATION.REQUIRED),
    minLength(1, VALIDATION.REQUIRED)
  ),
})

/**
 * Reset Password validation schema
 * - Requires password and confirmPassword
 * - Passwords must match
 */
export const ResetPasswordSchema = pipe(
  object({
    password: PasswordSchema,
    confirmPassword: string(VALIDATION.REQUIRED),
    token: string(VALIDATION.REQUIRED),
  }),
  forward(
    check(
      (input) => input.password === input.confirmPassword,
      'Passwords do not match. Please try again.'
    ),
    ['confirmPassword']
  )
)

/**
 * Increment request schema
 * Note: Currently doesn't require any specific fields
 * but could be extended if parameters are added later
 */
export const IncrementSchema = object({})

/**
 * Helper function to validate request data against a schema
 * @param data - The data to validate
 * @param schema - The schema to validate against
 * @returns A tuple with [isValid, result, error]
 */
export function validateRequest<
  T extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(data: unknown, schema: T): [boolean, InferOutput<T> | null, string | null] {
  const result = safeParse(schema, data)

  if (result.success) {
    return [true, result.output, null]
  } else {
    // Extract human-readable error message from validation error
    let errorMessage = result.issues
      .map(
        (issue) =>
          issue.message || `Invalid ${issue.path?.map((p) => p.key).join('.')}`
      )
      .join(', ')
    if (errorMessage?.startsWith('Invalid type: Expected unknown')) {
      errorMessage = VALIDATION.EMAIL_INVALID
    }

    return [false, null, errorMessage]
  }
}
