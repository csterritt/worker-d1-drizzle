/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithMessage } from '../../lib/redirects'
import { PATHS, COOKIES, STANDARD_SECURE_HEADERS } from '../../constants'
import type { Bindings } from '../../local-types'
import { createDbClient } from '../../db/client'
import {
  getUserIdByEmail,
  updateAccountTimestamp,
  consumeSingleUseCode,
} from '../../lib/db-access'
import { addCookie } from '../../lib/cookie-support'

/**
 * Handle gated sign-up form submission with code validation
 * Processes registration via better-auth only after validating and consuming single-use code
 */
export const handleGatedSignUp = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(
    PATHS.AUTH.SIGN_UP,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        const formData = await c.req.formData()
        const code = formData.get('code') as string
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        // Validate required fields (trim whitespace from code)
        const trimmedCode = code?.trim()
        if (!trimmedCode || !name || !email || !password) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_UP,
            'All fields are required for sign-up.'
          )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_UP,
            'Please enter a valid email address.'
          )
        }

        // Validate password length
        if (password.length < 8) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_UP,
            'Password must be at least 8 characters long.'
          )
        }

        // Validate and consume the sign-up code FIRST
        const dbClient = createDbClient(c.env.PROJECT_DB)
        const codeResult = await consumeSingleUseCode(dbClient, trimmedCode)

        if (codeResult.isErr) {
          console.error(
            'Database error validating sign-up code:',
            codeResult.error
          )
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_UP,
            'Something went wrong validating your sign-up code. Please try again.'
          )
        }

        if (!codeResult.value) {
          // Code didn't exist or was already used
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_UP,
            'Invalid or expired sign-up code. Please check your code and try again.'
          )
        }

        // Code was valid and consumed - proceed with account creation
        // Create better-auth instance
        const auth = createAuth(c.env)

        // Attempt to sign up via better-auth API with comprehensive error handling
        try {
          const signUpResponse = await auth.api.signUpEmail({
            body: {
              name,
              email,
              password,
              callbackURL: `${PATHS.AUTH.SIGN_IN}/true`,
            },
          })

          if (!signUpResponse) {
            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_UP,
              'Failed to create account. Please try again.'
            )
          }

          // Check if there was an error in the response
          if ('error' in signUpResponse) {
            const errorMessage =
              (signUpResponse.error as any)?.message || 'Registration failed'
            console.log('Better-auth error response:', errorMessage)

            // Handle specific error cases
            if (
              errorMessage.toLowerCase().includes('already exists') ||
              errorMessage.toLowerCase().includes('duplicate') ||
              errorMessage.toLowerCase().includes('unique constraint') ||
              errorMessage.toLowerCase().includes('unique') ||
              errorMessage.toLowerCase().includes('email')
            ) {
              // Redirect to await verification page with email cookie for duplicate emails
              addCookie(c, COOKIES.EMAIL_ENTERED, email)
              return redirectWithMessage(
                c,
                PATHS.AUTH.AWAIT_VERIFICATION,
                'An account with this email already exists. Please check your email for a verification link or sign in if you have already verified your account.'
              )
            }

            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_UP,
              `Registration failed: ${errorMessage}`
            )
          }

          // Check response status
          if ('status' in signUpResponse && signUpResponse.status !== 200) {
            console.log('Better-auth non-200 status:', signUpResponse.status)
            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_UP,
              'Registration failed. Please try again.'
            )
          }
        } catch (apiError: any) {
          console.error('Better-auth sign-up API error:', apiError)

          // Check if it's a duplicate email error from database or API
          const errorMessage = apiError?.message || String(apiError)
          const errorString = errorMessage.toLowerCase()

          if (
            errorString.includes('already exists') ||
            errorString.includes('duplicate') ||
            errorString.includes('unique constraint') ||
            errorString.includes('unique') ||
            errorString.includes('violates unique') ||
            (errorString.includes('email') && errorString.includes('exists'))
          ) {
            // Redirect to await verification page with email cookie for duplicate emails
            addCookie(c, COOKIES.EMAIL_ENTERED, email)
            return redirectWithMessage(
              c,
              PATHS.AUTH.AWAIT_VERIFICATION,
              'An account with this email already exists. Please check your email for a verification link or sign in if you have already verified your account.'
            )
          }

          // Check for specific database constraint errors
          if (
            errorString.includes('constraint') ||
            errorString.includes('sqlite_constraint')
          ) {
            // Redirect to await verification page with email cookie for constraint errors (likely duplicate email)
            addCookie(c, COOKIES.EMAIL_ENTERED, email)
            return redirectWithMessage(
              c,
              PATHS.AUTH.AWAIT_VERIFICATION,
              'An account with this email already exists. Please check your email for a verification link or sign in if you have already verified your account.'
            )
          }

          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_UP,
            'Something went wrong during registration. Please try again.'
          )
        }

        // Successful sign-up!
        // Update the account's updatedAt field to track the initial email send time
        try {
          // Find the user that was just created
          const userIdResult = await getUserIdByEmail(dbClient, email)

          if (userIdResult.isOk && userIdResult.value.length > 0) {
            // Update the account's updatedAt field for this user
            const updateResult = await updateAccountTimestamp(
              dbClient,
              userIdResult.value[0].id
            )

            if (updateResult.isErr) {
              console.error(
                'Database error updating account timestamp:',
                updateResult.error
              )
              // Don't fail the sign-up process if this fails
            }
          }
        } catch (dbError) {
          console.error('Error updating account timestamp:', dbError)
          // Don't fail the sign-up process if this fails
        }

        // Redirect to await verification page with email cookie
        addCookie(c, COOKIES.EMAIL_ENTERED, email)
        return c.redirect(PATHS.AUTH.AWAIT_VERIFICATION)
      } catch (error) {
        console.error('Gated sign-up error:', error)

        // Handle network/API errors gracefully
        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_UP,
          'Something went wrong during registration. Please try again.'
        )
      }
    }
  )
}
