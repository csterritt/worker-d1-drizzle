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
  transform,
  type BaseSchema,
  type BaseIssue,
  type InferOutput,
} from 'valibot'
import { MESSAGES, VALIDATION } from '../constants'

// Email validation function
const validateEmail = (value: unknown) => {
  if (typeof value !== 'string') {
    return false
  }
  return VALIDATION.EMAIL_PATTERN.test(value)
}

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128
const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100
const CODE_MIN_LENGTH = 4
const CODE_MAX_LENGTH = 64
const TOKEN_MIN_LENGTH = 16
const TOKEN_MAX_LENGTH = 128
export const RESET_TOKEN_ERROR_MESSAGE =
  'Invalid reset token. Please request a new password reset link.'

/**
 * Email validation schema
 * - Must be a string
 * - Between 1 and 254 characters (standard email length limits)
 * - Must match email regex pattern
 */
export const EmailSchema = pipe(
  string(MESSAGES.EMAIL_REQUIRED),
  transform((value) => value.trim().toLowerCase()),
  minLength(1, MESSAGES.EMAIL_REQUIRED),
  maxLength(254, VALIDATION.EMAIL_INVALID),
  custom(validateEmail, VALIDATION.EMAIL_INVALID)
)

export const PasswordSchema = pipe(
  string('Password is required.'),
  transform((value) => value.trim()),
  minLength(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
  ),
  maxLength(
    PASSWORD_MAX_LENGTH,
    `Password must be at most ${PASSWORD_MAX_LENGTH} characters long.`
  )
)

export const NameSchema = pipe(
  string('Name is required.'),
  transform((value) => value.trim()),
  minLength(NAME_MIN_LENGTH, 'Name must be at least 2 characters long.'),
  maxLength(NAME_MAX_LENGTH, 'Name must be at most 100 characters long.')
)

export const GatedCodeSchema = pipe(
  string('Sign-up code is required.'),
  transform((value) => value.trim()),
  minLength(CODE_MIN_LENGTH, 'Sign-up code is too short.'),
  maxLength(CODE_MAX_LENGTH, 'Sign-up code is too long.')
)

export const SignInSchema = object({
  email: EmailSchema,
  password: PasswordSchema,
})

export const SignUpSchema = object({
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
})

export const GatedSignUpSchema = object({
  code: GatedCodeSchema,
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
})

export const ForgotPasswordSchema = object({
  email: EmailSchema,
})

export const ResendEmailSchema = object({
  email: EmailSchema,
})

export const InterestSignUpSchema = object({
  email: EmailSchema,
})

export const ResetPasswordSchema = pipe(
  object({
    token: pipe(
      string(RESET_TOKEN_ERROR_MESSAGE),
      transform((value) => value.trim()),
      minLength(TOKEN_MIN_LENGTH, RESET_TOKEN_ERROR_MESSAGE),
      maxLength(TOKEN_MAX_LENGTH, RESET_TOKEN_ERROR_MESSAGE)
    ),
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
  }),
  custom((payload) => {
    const data = payload as {
      token: string
      password: string
      confirmPassword: string
    }
    return data.password === data.confirmPassword
  }, 'Passwords do not match. Please try again.')
)

/**
 * Increment request schema
 * Note: Currently doesn't require any specific fields
 * but could be extended if parameters are added later
 */
export const IncrementSchema = object({})

/**
 * Safely read a string value from form data
 */
export const getFormValue = (formData: FormData, field: string): string => {
  const value = formData.get(field)
  if (typeof value === 'string') {
    return value
  }

  return ''
}

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
    const messages = result.issues.map(
      (issue) =>
        issue.message || `Invalid ${issue.path?.map((p) => p.key).join('.')}`
    )

    const uniqueMessages: string[] = []
    messages.forEach((message) => {
      if (!uniqueMessages.includes(message)) {
        uniqueMessages.push(message)
      }
    })

    let errorMessage = uniqueMessages.join(', ')
    if (errorMessage?.startsWith('Invalid type: Expected unknown')) {
      errorMessage = VALIDATION.EMAIL_INVALID
    }

    return [false, null, errorMessage]
  }
}
