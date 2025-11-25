/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Validation schemas for API requests using Valibot.
 * @module lib/validators
 */
import {
  object,
  string,
  safeParse,
  minLength,
  maxLength,
  pipe,
  custom,
  optional,
  type BaseSchema,
  type BaseIssue,
  type InferOutput,
} from 'valibot'
import { VALIDATION } from '../constants'

// Email validation function
const validateEmail = (value: unknown) => {
  if (typeof value !== 'string') {
    return false
  }
  const v = value.trim().toLowerCase()
  return VALIDATION.EMAIL_PATTERN.test(v)
}

/**
 * Email validation schema
 * - Must be a string
 * - Between 1 and 254 characters (standard email length limits)
 * - Must match email regex pattern
 */
export const EmailSchema = pipe(
  string(VALIDATION.REQUIRED),
  minLength(1, VALIDATION.EMAIL_INVALID),
  maxLength(254, VALIDATION.EMAIL_INVALID),
  custom(validateEmail)
)

/**
 * Interest sign-up form schema
 */
export const InterestSignUpFormSchema = object({
  email: EmailSchema,
})

/**
 * Forgot password form schema
 */
export const ForgotPasswordFormSchema = object({
  email: EmailSchema,
})

/**
 * Sign-in form schema
 */
export const SignInSchema = object({
  email: EmailSchema,
  password: pipe(
    string(VALIDATION.REQUIRED),
    minLength(1, 'Password is required.')
  ),
})

/**
 * Open sign-up form schema
 */
export const SignUpFormSchema = object({
  name: pipe(
    string(VALIDATION.REQUIRED),
    minLength(1, VALIDATION.NAME_REQUIRED),
    maxLength(100, 'Name must be 100 characters or fewer'),
    custom(
      (v) => typeof v === 'string' && v.trim().length > 0,
      VALIDATION.NAME_REQUIRED
    )
  ),
  email: EmailSchema,
  password: pipe(
    string(VALIDATION.REQUIRED),
    minLength(8, VALIDATION.PASSWORD_MIN_LENGTH),
    maxLength(128, 'Password must be at most 128 characters long')
  ),
})

/**
 * Gated sign-up form schema
 */
export const GatedSignUpFormSchema = object({
  code: pipe(
    string(VALIDATION.REQUIRED),
    minLength(8, 'Sign-up code must be at least 8 characters long.'),
    maxLength(64, 'Sign-up code is too long.'),
    custom(
      (v) => typeof v === 'string' && v.trim().length > 0,
      'Sign-up code is required'
    )
  ),
  name: pipe(
    string(VALIDATION.REQUIRED),
    minLength(1, VALIDATION.NAME_REQUIRED),
    maxLength(100, 'Name must be 100 characters or fewer'),
    custom(
      (v) => typeof v === 'string' && v.trim().length > 0,
      VALIDATION.NAME_REQUIRED
    )
  ),
  email: EmailSchema,
  password: pipe(
    string(VALIDATION.REQUIRED),
    minLength(8, VALIDATION.PASSWORD_MIN_LENGTH),
    maxLength(128, 'Password must be at most 128 characters long')
  ),
})

/**
 * Resend verification email form schema
 */
export const ResendEmailFormSchema = object({
  email: EmailSchema,
})

/**
 * Reset password form schema
 */
export const ResetPasswordFormSchema = pipe(
  object({
    token: pipe(
      string(VALIDATION.REQUIRED),
      minLength(
        1,
        'Invalid reset token. Please request a new password reset link.'
      )
    ),
    password: pipe(
      string(VALIDATION.REQUIRED),
      minLength(8, VALIDATION.PASSWORD_MIN_LENGTH)
    ),
    confirmPassword: pipe(
      string(VALIDATION.REQUIRED),
      minLength(8, VALIDATION.PASSWORD_MIN_LENGTH)
    ),
  }),
  custom((data) => {
    const d = data as { password: string; confirmPassword: string }
    return d && d.password === d.confirmPassword
  }, 'Passwords do not match. Please try again.')
)

/**
 * Change password form schema (for profile page)
 */
export const ChangePasswordFormSchema = pipe(
  object({
    currentPassword: pipe(
      string(VALIDATION.REQUIRED),
      minLength(1, 'Current password is required.')
    ),
    newPassword: pipe(
      string(VALIDATION.REQUIRED),
      minLength(8, VALIDATION.PASSWORD_MIN_LENGTH)
    ),
    confirmPassword: pipe(
      string(VALIDATION.REQUIRED),
      minLength(8, VALIDATION.PASSWORD_MIN_LENGTH)
    ),
    userInfo: optional(
      pipe(
        string(),
        custom(
          (v) =>
            typeof v === 'string' &&
            (v.trim() === '' ||
              (/^\s*\d+\s*$/.test(v) && parseInt(v, 10) >= 0)),
          'User information must be a non-negative number.'
        )
      )
    ),
  }),
  custom((data) => {
    const d = data as { newPassword: string; confirmPassword: string }
    return d && d.newPassword === d.confirmPassword
  }, 'New passwords do not match. Please try again.')
)

/**
 * Dynamic path parameter validation schemas
 */
export const PathSignInValidationParamSchema = object({
  validationSuccessful: optional(
    pipe(
      string(),
      custom((v) => v === 'true', 'Invalid validation flag.')
    )
  ),
})

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

/**
 * Helper function to extract a string value from FormData
 * @param formData - The FormData object
 * @param key - The key to extract
 * @returns The string value or empty string if not found
 */
export const getFormValue = (formData: FormData, key: string): string => {
  const value = formData.get(key)
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  // Handle File objects (shouldn't happen for text fields, but be safe)
  return ''
}
