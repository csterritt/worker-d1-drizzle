/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Handler for combined gated + interest sign-up form submissions.
 * Handles both the gated sign-up (with code) and interest sign-up (waitlist) forms.
 * @module routes/auth/handleGatedInterestSignUp
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithError, redirectWithMessage } from '../../lib/redirects'
import { PATHS, STANDARD_SECURE_HEADERS, MESSAGES } from '../../constants'
import type { Bindings, DrizzleClient } from '../../local-types'
import { createDbClient } from '../../db/client'
import { consumeSingleUseCode, addInterestedEmail } from '../../lib/db-access'
import { addCookie } from '../../lib/cookie-support'
import { COOKIES } from '../../constants'
import {
  validateRequest,
  GatedSignUpFormSchema,
  InterestSignUpFormSchema,
} from '../../lib/validators'
import {
  handleSignUpResponseError,
  handleSignUpApiError,
  updateAccountTimestampAfterSignUp,
  redirectToAwaitVerification,
} from '../../lib/sign-up-utils'

interface GatedSignUpData {
  code: string
  name: string
  email: string
  password: string
}

/**
 * Handle gated sign-up form submission with code validation
 * Processes registration via better-auth only after validating and consuming single-use code
 */
export const handleGatedInterestSignUp = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  // Handle gated sign-up (with code)
  app.post(
    PATHS.AUTH.SIGN_UP,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        const body = await c.req.parseBody()
        const [ok, data, err] = validateRequest(body, GatedSignUpFormSchema)

        if (!ok) {
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_UP,
            err || MESSAGES.INVALID_INPUT
          )
        }

        const { code, name, email, password } = data as GatedSignUpData
        const trimmedCode = code.trim()
        const dbClient = createDbClient(c.env.PROJECT_DB)

        // Validate and consume the sign-up code FIRST
        const codeResult = await consumeSingleUseCode(dbClient, trimmedCode)

        if (codeResult.isErr) {
          console.error(
            'Database error validating sign-up code:',
            codeResult.error
          )
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_UP,
            MESSAGES.GENERIC_ERROR_TRY_AGAIN
          )
        }

        if (!codeResult.value) {
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_UP,
            'Invalid or expired sign-up code. Please check your code and try again.'
          )
        }

        // Code was valid and consumed - proceed with account creation
        const auth = createAuth(c.env)

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
            return redirectWithError(
              c,
              PATHS.AUTH.SIGN_UP,
              'Failed to create account. Please try again.'
            )
          }

          const errorResponse = handleSignUpResponseError(
            c,
            signUpResponse,
            email,
            PATHS.AUTH.SIGN_UP
          )

          if (errorResponse) {
            return errorResponse
          }

          if ('status' in signUpResponse && signUpResponse.status !== 200) {
            console.log('Better-auth non-200 status:', signUpResponse.status)
            return redirectWithError(
              c,
              PATHS.AUTH.SIGN_UP,
              MESSAGES.GENERIC_ERROR_TRY_AGAIN
            )
          }
        } catch (apiError: unknown) {
          return handleSignUpApiError(c, apiError, email, PATHS.AUTH.SIGN_UP)
        }

        await updateAccountTimestampAfterSignUp(dbClient, email)

        return redirectToAwaitVerification(c, email)
      } catch (error) {
        console.error('Gated sign-up error:', error)
        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_UP,
          MESSAGES.REGISTRATION_GENERIC_ERROR
        )
      }
    }
  )

  // Handle interest sign-up (waitlist)
  app.post(
    PATHS.AUTH.INTEREST_SIGN_UP,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      console.log('🔧 handleInterestSignUp (both mode) called')

      // Check if user is already signed in
      const user = (c as unknown as { get: (key: string) => unknown }).get(
        'user'
      ) as { id: string } | null
      if (user) {
        console.log('Already signed in')
        return redirectWithMessage(c, PATHS.PRIVATE, MESSAGES.ALREADY_SIGNED_IN)
      }

      // Get form data and validate
      const body = await c.req.parseBody()
      const [ok, data, err] = validateRequest(body, InterestSignUpFormSchema)
      if (!ok) {
        const emailEntered = (body as any)?.email as string
        if (emailEntered) {
          addCookie(c, COOKIES.EMAIL_ENTERED, emailEntered)
        }

        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_UP,
          err || MESSAGES.INVALID_INPUT
        )
      }

      const email = data!.email as string
      const trimmedEmail = email.trim().toLowerCase()
      console.log('Processing interest sign-up for email:', trimmedEmail)

      // Get database instance
      const db = c.get('db') as DrizzleClient

      try {
        console.log('🔧 About to call addInterestedEmail for:', trimmedEmail)
        // Add email to interested emails list
        const addResult = await addInterestedEmail(db, trimmedEmail)
        console.log(
          '🔧 addInterestedEmail completed, result:',
          addResult.isOk ? 'SUCCESS' : 'ERROR'
        )

        if (addResult.isErr) {
          console.error(
            'Database error adding interested email:',
            addResult.error
          )
          addCookie(c, COOKIES.EMAIL_ENTERED, email)
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_UP,
            'Sorry, there was an error processing your request. Please try again.'
          )
        }

        if (!addResult.value) {
          // Email already exists in the list
          console.log('Email already registered for interest:', trimmedEmail)
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            "Thanks! Your email is already on our waitlist. We'll notify you when we're accepting new accounts."
          )
        }

        // Successfully added to waitlist
        console.log('Email successfully added to waitlist:', trimmedEmail)
        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          "Thanks! You've been added to our waitlist. We'll notify you when we start accepting new accounts."
        )
      } catch (error) {
        console.error('Unexpected error in handleInterestSignUp:', error)
        addCookie(c, COOKIES.EMAIL_ENTERED, email)
        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_UP,
          'Sorry, there was an error processing your request. Please try again.'
        )
      }
    }
  )
}
