/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithError } from '../../lib/redirects'
import { PATHS, STANDARD_SECURE_HEADERS, MESSAGES } from '../../constants'
import type { Bindings } from '../../local-types'
import { createDbClient } from '../../db/client'
import {
  validateSingleUseCode,
  consumeSingleUseCode,
} from '../../lib/db-access'
import { validateRequest, GatedSignUpFormSchema } from '../../lib/validators'
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
export const handleGatedSignUp = (app: Hono<{ Bindings: Bindings }>): void => {
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

        // Validate the sign-up code exists (don't consume yet)
        const codeResult = await validateSingleUseCode(dbClient, trimmedCode)

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

        // Code is valid - proceed with account creation
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

        // Account created successfully - now consume the code
        const consumeResult = await consumeSingleUseCode(dbClient, trimmedCode)
        if (consumeResult.isErr) {
          console.error('Failed to consume sign-up code:', consumeResult.error)
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
}
